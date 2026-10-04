/**
 * Weekly Planning and daily recommendation (Product Spec §19), plus the
 * "Quests Need Attention" rule (§22). Pure functions; the server supplies data.
 */

import { dateCondition, type QuestPriority } from "./quests";

const DAY = 86_400_000;
export const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

/** The seven dates of the week that starts on `weekStart`. */
export function weekDates(weekStartDate: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
}

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

// ---------------------------------------------------------------------------
// Quests Need Attention
// ---------------------------------------------------------------------------

export type AttentionInput = { status: string; targetDate: string | null; deadline: string | null };
export type AttentionReason = "PAST_DEADLINE" | "PAST_TARGET";

/**
 * An active Quest needs a decision once its target date or hard deadline has
 * passed. Overdue is a condition, never a status, and never a red counter.
 */
export function attentionReason(q: AttentionInput, today: string): AttentionReason | null {
  if (!["ACCEPTED", "IN_PROGRESS", "ON_HOLD"].includes(q.status)) return null;
  const c = dateCondition(q.targetDate, q.deadline, today);
  if (c.pastDeadline) return "PAST_DEADLINE";
  if (c.pastTarget) return "PAST_TARGET";
  return null;
}

// ---------------------------------------------------------------------------
// Daily recommendation
// ---------------------------------------------------------------------------

export type RecommendationCandidate = {
  id: string;
  status: string;
  priority: QuestPriority;
  isBoss: boolean;
  isRespawnQuest: boolean;
  targetDate: string | null;
  deadline: string | null;
  plannedToday: boolean;
  progressPercent: number;
};

export type Recommendation = { id: string; reason: string };

/**
 * The most relevant Quest for today. Deterministic: planned-for-today first,
 * then the Respawn Quest, the Boss, Main Quests, the nearest real deadline,
 * the nearest target, and finally momentum (most progress).
 */
export function recommendQuests(candidates: readonly RecommendationCandidate[], today: string, limit = 3): Recommendation[] {
  const open = candidates.filter((c) => c.status === "ACCEPTED" || c.status === "IN_PROGRESS");
  const days = (d: string | null) => (d ? dateCondition(d, null, today).daysToTarget! : Number.POSITIVE_INFINITY);
  const scored = open.map((c) => {
    const deadlineIn = days(c.deadline);
    const targetIn = days(c.targetDate);
    let reason = "Keep your momentum going.";
    if (c.plannedToday) reason = "Planned for today.";
    else if (c.isRespawnQuest) reason = "Your Respawn Quest — one clear win.";
    else if (c.isBoss) reason = "Your Current Boss.";
    else if (deadlineIn <= 3) reason = deadlineIn < 0 ? "Its hard deadline has passed." : "Its hard deadline is close.";
    else if (c.priority === "MAIN") reason = "One of your Main Quests.";
    else if (targetIn <= 3) reason = "Its target date is close.";
    const key = [
      c.plannedToday ? 0 : 1,
      c.isRespawnQuest ? 0 : 1,
      c.isBoss ? 0 : 1,
      deadlineIn <= 3 ? 0 : 1,
      c.priority === "MAIN" ? 0 : 1,
      Math.min(deadlineIn, targetIn),
      -c.progressPercent,
    ];
    return { id: c.id, reason, key };
  });
  scored.sort((a, b) => {
    for (let i = 0; i < a.key.length; i++) {
      if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
    }
    return a.id.localeCompare(b.id);
  });
  return scored.slice(0, limit).map(({ id, reason }) => ({ id, reason }));
}

/** During a Respawn recovery window, recommend less (Product Spec §23.2). */
export function recommendedLimit(inRecovery: boolean): number {
  return inRecovery ? 1 : 3;
}

export function inRecovery(recoveryUntil: string | null, today: string): boolean {
  return Boolean(recoveryUntil && today <= recoveryUntil);
}
