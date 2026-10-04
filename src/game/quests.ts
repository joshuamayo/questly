/**
 * Quest rules (pure). Persistence lives in src/server/quests; these functions
 * decide what is valid and what a Quest is worth.
 */

import { QUEST_REWARDS, MAIN_QUEST_CAP, type QuestReward } from "./config/balance";
import { GameRuleError } from "./errors";
import { isSkillKey, QUEST_DIFFICULTIES, type QuestDifficulty, type SkillKey } from "./vocabulary";

export const QUEST_STATUSES = [
  "AVAILABLE",
  "LOCKED",
  "ACCEPTED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "ABANDONED",
] as const;
export type QuestStatus = (typeof QUEST_STATUSES)[number];

/** Statuses of a Quest the character is currently pursuing. */
export const ACTIVE_QUEST_STATUSES: readonly QuestStatus[] = ["ACCEPTED", "IN_PROGRESS", "ON_HOLD"];

export const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
  AVAILABLE: "Available",
  LOCKED: "Locked",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

export type QuestPriority = "MAIN" | "SIDE";

export const LIMITS = {
  titleMax: 120,
  descriptionMax: 2_000,
  notesMax: 10_000,
  objectiveTitleMax: 200,
  objectivesMax: 40,
} as const;

export class QuestRuleError extends GameRuleError {
  constructor(message: string, code = "QUEST_RULE") {
    super(message, code);
  }
}

export function isQuestDifficulty(value: string): value is QuestDifficulty {
  return (QUEST_DIFFICULTIES as readonly string[]).includes(value);
}

export function isActiveStatus(status: string): boolean {
  return (ACTIVE_QUEST_STATUSES as readonly string[]).includes(status);
}

/** Rewards for a difficulty under the given balance table (defaults to live config). */
export function rewardsFor(
  difficulty: QuestDifficulty,
  balance: Readonly<Record<QuestDifficulty, QuestReward>> = QUEST_REWARDS,
): QuestReward {
  return { ...balance[difficulty] };
}

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

export type QuestDraftInput = {
  title: string;
  description?: string;
  skillKey: string;
  difficulty: string;
  targetDate?: string | null;
  deadline?: string | null;
  priority?: QuestPriority;
  objectives?: string[];
  notes?: string;
};

export type QuestDraft = {
  title: string;
  description: string;
  skillKey: SkillKey;
  difficulty: QuestDifficulty;
  targetDate: string | null;
  deadline: string | null;
  priority: QuestPriority;
  objectives: string[];
  notes: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates a calendar date string (YYYY-MM-DD); empty → null. */
export function normalizeDate(value: string | null | undefined, label: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (!ISO_DATE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) {
    throw new QuestRuleError(`${label} must be a valid date.`, "INVALID_DATE");
  }
  // Reject impossible dates such as 2026-02-31 (Date.parse rolls them over).
  if (new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) !== v) {
    throw new QuestRuleError(`${label} must be a valid date.`, "INVALID_DATE");
  }
  return v;
}

export function normalizeObjectives(objectives: readonly string[] | undefined): string[] {
  const list = (objectives ?? []).map((o) => o.trim()).filter(Boolean);
  if (list.length > LIMITS.objectivesMax) {
    throw new QuestRuleError(`A Quest can have at most ${LIMITS.objectivesMax} objectives.`, "TOO_MANY_OBJECTIVES");
  }
  for (const o of list) {
    if (o.length > LIMITS.objectiveTitleMax) {
      throw new QuestRuleError(
        `Objectives must be ${LIMITS.objectiveTitleMax} characters or fewer.`,
        "OBJECTIVE_TOO_LONG",
      );
    }
  }
  return list;
}

export function normalizeTitle(title: string): string {
  const t = title.trim();
  if (!t) throw new QuestRuleError("Every Quest needs a name.", "TITLE_REQUIRED");
  if (t.length > LIMITS.titleMax) {
    throw new QuestRuleError(`Quest names must be ${LIMITS.titleMax} characters or fewer.`, "TITLE_TOO_LONG");
  }
  return t;
}

export function assertDateOrder(targetDate: string | null, deadline: string | null): void {
  if (targetDate && deadline && targetDate > deadline) {
    throw new QuestRuleError("The target date should be on or before the hard deadline.", "TARGET_AFTER_DEADLINE");
  }
}

export function validateQuestDraft(input: QuestDraftInput): QuestDraft {
  const title = normalizeTitle(input.title);
  const description = (input.description ?? "").trim();
  if (description.length > LIMITS.descriptionMax) {
    throw new QuestRuleError("The description is too long.", "DESCRIPTION_TOO_LONG");
  }
  if (!isSkillKey(input.skillKey)) throw new QuestRuleError("Choose one of the six Skills.", "INVALID_SKILL");
  if (!isQuestDifficulty(input.difficulty)) throw new QuestRuleError("Choose a difficulty.", "INVALID_DIFFICULTY");
  const targetDate = normalizeDate(input.targetDate, "Target date");
  const deadline = normalizeDate(input.deadline, "Hard deadline");
  assertDateOrder(targetDate, deadline);
  const notes = (input.notes ?? "").trim();
  if (notes.length > LIMITS.notesMax) throw new QuestRuleError("Notes are too long.", "NOTES_TOO_LONG");
  return {
    title,
    description,
    skillKey: input.skillKey,
    difficulty: input.difficulty,
    targetDate,
    deadline,
    priority: input.priority === "MAIN" ? "MAIN" : "SIDE",
    objectives: normalizeObjectives(input.objectives),
    notes,
  };
}

export function assertMainQuestCapacity(activeMainCount: number, cap: number = MAIN_QUEST_CAP): void {
  if (activeMainCount >= cap) {
    throw new QuestRuleError(
      `You already have ${cap} Main Quests. Complete one or make it a Side Quest first.`,
      "MAIN_QUEST_CAP",
    );
  }
}

// ---------------------------------------------------------------------------
// Progress & conditions
// ---------------------------------------------------------------------------

export type ObjectiveState = { id: string; position: number; completedAt: Date | string | null };

export type QuestProgress = {
  done: number;
  total: number;
  /** 0–100; a Quest without objectives reports 0 until completed. */
  percent: number;
  /** The first open objective by position — the Current Step. */
  currentObjectiveId: string | null;
  allDone: boolean;
};

export function questProgress(objectives: readonly ObjectiveState[]): QuestProgress {
  const ordered = [...objectives].sort((a, b) => a.position - b.position);
  const done = ordered.filter((o) => o.completedAt).length;
  const total = ordered.length;
  return {
    done,
    total,
    percent: total ? Math.floor((done / total) * 100) : 0,
    currentObjectiveId: ordered.find((o) => !o.completedAt)?.id ?? null,
    allDone: done === total,
  };
}

export type DateCondition = {
  /** Whole days until the target date (negative once passed); null without a target. */
  daysToTarget: number | null;
  daysToDeadline: number | null;
  pastTarget: boolean;
  pastDeadline: boolean;
};

function dayNumber(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);
}

/**
 * Overdue is a condition, never a status (Product Spec §8.2). `today` is the
 * viewer's local calendar date as YYYY-MM-DD.
 */
export function dateCondition(targetDate: string | null, deadline: string | null, today: string): DateCondition {
  const t = dayNumber(today);
  const daysToTarget = targetDate ? dayNumber(targetDate) - t : null;
  const daysToDeadline = deadline ? dayNumber(deadline) - t : null;
  return {
    daysToTarget,
    daysToDeadline,
    pastTarget: daysToTarget !== null && daysToTarget < 0,
    pastDeadline: daysToDeadline !== null && daysToDeadline < 0,
  };
}

/** Human phrase for a day offset: "Today", "Tomorrow", "in 5 days", "2 days ago". */
export function describeDayOffset(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export type QuestAction = "COMPLETE_OBJECTIVE" | "EDIT" | "HOLD" | "RESUME" | "ABANDON" | "RESTORE" | "COMPLETE";

const ALLOWED: Record<QuestAction, readonly QuestStatus[]> = {
  COMPLETE_OBJECTIVE: ["ACCEPTED", "IN_PROGRESS"],
  EDIT: ["ACCEPTED", "IN_PROGRESS", "ON_HOLD"],
  HOLD: ["ACCEPTED", "IN_PROGRESS"],
  RESUME: ["ON_HOLD"],
  ABANDON: ["ACCEPTED", "IN_PROGRESS", "ON_HOLD"],
  RESTORE: ["ABANDONED"],
  COMPLETE: ["ACCEPTED", "IN_PROGRESS"],
};

const BLOCKED_MESSAGES: Partial<Record<QuestStatus, string>> = {
  COMPLETED: "This Quest is already complete.",
  ABANDONED: "This Quest was abandoned. Restore it to continue.",
  ON_HOLD: "This Quest is on hold. Resume it to continue.",
};

export function canPerform(action: QuestAction, status: QuestStatus): boolean {
  return ALLOWED[action].includes(status);
}

export function assertCanPerform(action: QuestAction, status: QuestStatus): void {
  if (!canPerform(action, status)) {
    throw new QuestRuleError(BLOCKED_MESSAGES[status] ?? "That action is not available for this Quest.", "INVALID_TRANSITION");
  }
}

/** Status after resuming or restoring, based on whether any objective is done. */
export function activeStatusFor(progress: Pick<QuestProgress, "done">): QuestStatus {
  return progress.done > 0 ? "IN_PROGRESS" : "ACCEPTED";
}

/**
 * Split a Quest's XP across objectives for display only (e.g. Focus Mode).
 * The parts always sum to the Quest reward, so splitting a Quest into more
 * objectives can never multiply progression (CLAUDE.md §10).
 */
export function allocateObjectiveXp(rewardXp: number, objectiveCount: number): number[] {
  if (objectiveCount <= 0) return [];
  const base = Math.floor(rewardXp / objectiveCount);
  const remainder = rewardXp - base * objectiveCount;
  return Array.from({ length: objectiveCount }, (_, i) => base + (i < remainder ? 1 : 0));
}
