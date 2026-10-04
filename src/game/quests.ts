/**
 * Quest rules (pure). One ordered Quest Log: the first active Quest is the
 * Current Quest, every later active Quest is Locked (QUESTLY_PRODUCT_SPEC §9–10).
 * Current/Locked are derived here, never stored.
 */

import { GameRuleError } from "./errors";

export const QUEST_STATUSES = ["active", "completed", "archived"] as const;
export type QuestStatus = (typeof QUEST_STATUSES)[number];

export const QUEST_LIMITS = { titleMax: 120, descriptionMax: 2_000, gpMax: 100_000 } as const;

/** Suggested GP quick choices on Add Quest (spec §12). */
export const GP_QUICK_CHOICES = [5, 10, 15, 20, 50] as const;
export const DEFAULT_QUEST_GP = 10;

export class QuestRuleError extends GameRuleError {
  constructor(message: string, code = "QUEST_RULE") {
    super(message, code);
  }
}

export const NOT_CURRENT_MESSAGE = "This quest isn't next. Reorder it first if you want to work on it now.";

export function validateGp(value: unknown, label = "GP reward"): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > QUEST_LIMITS.gpMax) {
    throw new QuestRuleError(`${label} must be a whole number from 0 to ${QUEST_LIMITS.gpMax.toLocaleString("en-US")}.`, "INVALID_GP");
  }
  return value as number;
}

export type QuestInput = { title: string; description?: string; gpReward?: number };

export function validateQuestInput(input: QuestInput, defaultGp: number = DEFAULT_QUEST_GP) {
  const title = (input.title ?? "").trim();
  if (!title) throw new QuestRuleError("Every quest needs a title.", "TITLE_REQUIRED");
  if (title.length > QUEST_LIMITS.titleMax) {
    throw new QuestRuleError(`Quest titles must be ${QUEST_LIMITS.titleMax} characters or fewer.`, "TITLE_TOO_LONG");
  }
  const description = (input.description ?? "").trim();
  if (description.length > QUEST_LIMITS.descriptionMax) throw new QuestRuleError("The description is too long.", "DESCRIPTION_TOO_LONG");
  const gpReward = validateGp(input.gpReward ?? defaultGp);
  return { title, description, gpReward };
}

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

export type Orderable = { id: string; position: number; createdAt: Date | string };

/** Deterministic Quest Log order: position, then creation time, then id. */
export function sortQuestLog<T extends Orderable>(quests: readonly T[]): T[] {
  const time = (d: Date | string) => (typeof d === "string" ? Date.parse(d) : d.getTime());
  return [...quests].sort((a, b) => a.position - b.position || time(a.createdAt) - time(b.createdAt) || a.id.localeCompare(b.id));
}

/** Current = first active Quest; Locked = every active Quest after it. */
export function deriveQuestLog<T extends Orderable>(activeQuests: readonly T[]): { current: T | null; locked: T[] } {
  const ordered = sortQuestLog(activeQuests);
  return { current: ordered[0] ?? null, locked: ordered.slice(1) };
}

/**
 * Where a new Quest goes: the end of the list (default), right after the
 * Current Quest, or the top (it becomes Current).
 */
export type InsertPosition = "end" | "next" | "top";

export function insertIndex(position: InsertPosition | undefined, activeCount: number): number {
  if (position === "top") return 0;
  if (position === "next") return Math.min(1, activeCount);
  return activeCount;
}

/** Move one id within an ordered list. Returns the new order (input untouched). */
export function moveInOrder(ids: readonly string[], id: string, toIndex: number): string[] {
  const from = ids.indexOf(id);
  if (from < 0) throw new QuestRuleError("That quest is no longer in your Quest Log.", "QUEST_NOT_ACTIVE");
  const next = ids.filter((x) => x !== id);
  const to = Math.max(0, Math.min(Math.trunc(toIndex), next.length));
  next.splice(to, 0, id);
  return next;
}
