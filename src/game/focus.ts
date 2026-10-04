/**
 * Focus XP rules (pure). Focus Mode is an execution environment; Focus XP is
 * a modest reward with a daily cap so endless timer farming never pays.
 */

import { FOCUS_XP } from "./config/balance";
import { GameRuleError } from "./errors";

export type FocusConfig = Omit<typeof FOCUS_XP, "dailyXpCap"> & { dailyXpCap: number };

export function assertSessionMinutes(minutes: number, config: FocusConfig = FOCUS_XP): void {
  if (!Number.isInteger(minutes) || minutes < config.minSessionMinutes || minutes > config.maxSessionMinutes) {
    throw new GameRuleError(
      `Focus sessions last between ${config.minSessionMinutes} and ${config.maxSessionMinutes} minutes.`,
      "INVALID_SESSION_LENGTH",
    );
  }
}

/** Whole minutes actually focused, never more than planned. */
export function qualifyingMinutes(startedAt: Date, endedAt: Date, plannedMinutes: number): number {
  const elapsed = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60_000);
  return Math.max(0, Math.min(elapsed, plannedMinutes));
}

/** Base Focus XP for a session length (highest tier reached). */
export function baseFocusXp(minutes: number, config: FocusConfig = FOCUS_XP): number {
  return config.sessionTiers.find((t) => minutes >= t.minMinutes)?.xp ?? 0;
}

export type FocusXpResult = {
  baseXp: number;
  multiplier: number;
  xp: number;
  /** True when the daily cap reduced the award. */
  capped: boolean;
};

/**
 * Focus XP for a finished session, given what was already earned in the
 * last 24 hours: sessions beyond the full-value count earn a reduced share,
 * and the total never exceeds the daily cap.
 */
export function focusXpFor(
  minutes: number,
  recent: { qualifyingSessions: number; xpEarned: number },
  config: FocusConfig = FOCUS_XP,
): FocusXpResult {
  const baseXp = baseFocusXp(minutes, config);
  const multiplier =
    recent.qualifyingSessions >= config.diminishingReturns.fullValueSessionsPerDay ? config.diminishingReturns.reducedMultiplier : 1;
  const raw = Math.floor(baseXp * multiplier);
  const room = Math.max(0, config.dailyXpCap - recent.xpEarned);
  const xp = Math.min(raw, room);
  return { baseXp, multiplier, xp, capped: xp < raw };
}

/** Lowest session length that earns Focus XP. */
export function minimumQualifyingMinutes(config: FocusConfig = FOCUS_XP): number {
  return Math.min(...config.sessionTiers.map((t) => t.minMinutes));
}
