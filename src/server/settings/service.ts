/**
 * Character settings and Game Balance. Settings are JSON on the character,
 * normalized on read; balance overrides are validated on save and only ever
 * affect Quests accepted afterwards (rewards are snapshotted).
 */

import { eq } from "drizzle-orm";
import { GameRuleError } from "@/game/errors";
import { FOCUS_XP } from "@/game/config/balance";
import {
  effectiveBalance,
  normalizeSettings,
  validateBalanceOverrides,
  type BalanceOverrides,
  type CharacterSettings,
  type EffectiveBalance,
  type VacationPeriod,
} from "@/game/settings";
import { normalizeDate } from "@/game/quests";
import type { Db } from "../db/client";
import { activityEvents, characters } from "../db/schema";

export async function loadSettings(db: Db, characterId: string): Promise<CharacterSettings> {
  const [c] = await db.select({ settings: characters.settings }).from(characters).where(eq(characters.id, characterId));
  return normalizeSettings(c?.settings);
}

export async function loadBalance(db: Db, characterId: string): Promise<EffectiveBalance> {
  return effectiveBalance((await loadSettings(db, characterId)).balance);
}

async function save(db: Db, characterId: string, settings: CharacterSettings) {
  await db.update(characters).set({ settings }).where(eq(characters.id, characterId));
  return settings;
}

export type ScheduleInput = { weekStart: number; workdays: number[]; planningDay: number };

const isDay = (d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6;

export async function updateSchedule(db: Db, characterId: string, input: ScheduleInput) {
  if (!isDay(input.weekStart) || !isDay(input.planningDay)) throw new GameRuleError("Choose a day of the week.", "INVALID_DAY");
  const workdays = [...new Set(input.workdays)].filter(isDay).sort();
  if (workdays.length === 0) throw new GameRuleError("Choose at least one adventuring day.", "NO_WORKDAYS");
  const current = await loadSettings(db, characterId);
  return save(db, characterId, { ...current, weekStart: input.weekStart, workdays, planningDay: input.planningDay });
}

export async function updatePreferences(db: Db, characterId: string, input: { focusDefaultMinutes?: number; motion?: CharacterSettings["motion"] }) {
  const current = await loadSettings(db, characterId);
  const next = { ...current };
  if (input.focusDefaultMinutes !== undefined) {
    if (!(FOCUS_XP.timerPresetsMinutes as readonly number[]).includes(input.focusDefaultMinutes)) {
      throw new GameRuleError("Choose one of the Focus timer presets.", "INVALID_PRESET");
    }
    next.focusDefaultMinutes = input.focusDefaultMinutes;
  }
  if (input.motion !== undefined) {
    if (!["system", "reduce", "full"].includes(input.motion)) throw new GameRuleError("Choose a motion setting.", "INVALID_MOTION");
    next.motion = input.motion;
  }
  return save(db, characterId, next);
}

export async function updateBalance(db: Db, characterId: string, overrides: BalanceOverrides) {
  const clean = validateBalanceOverrides(overrides);
  const current = await loadSettings(db, characterId);
  await save(db, characterId, { ...current, balance: clean });
  await db.insert(activityEvents).values({ characterId, type: "GAME_BALANCE_CHANGED", entityId: characterId, payload: { overrides: clean } });
  return clean;
}

export async function updateDisplayName(db: Db, characterId: string, name: string) {
  const clean = name.trim();
  if (!clean) throw new GameRuleError("Your character needs a name.", "NAME_REQUIRED");
  if (clean.length > 40) throw new GameRuleError("Names must be 40 characters or fewer.", "NAME_TOO_LONG");
  await db.update(characters).set({ displayName: clean }).where(eq(characters.id, characterId));
}

/** Add a vacation/pause period. Paused days never break streaks. */
export async function addVacation(db: Db, characterId: string, input: { start: string; end: string | null }) {
  const start = normalizeDate(input.start, "Start date");
  const end = normalizeDate(input.end, "End date");
  if (!start) throw new GameRuleError("Choose when the pause begins.", "START_REQUIRED");
  if (end && end < start) throw new GameRuleError("The pause must end on or after it begins.", "END_BEFORE_START");
  const current = await loadSettings(db, characterId);
  if (current.vacations.length >= 50) throw new GameRuleError("That is a lot of vacations. Remove an old one first.", "TOO_MANY_VACATIONS");
  const vacations: VacationPeriod[] = [...current.vacations, { start, end }].sort((a, b) => a.start.localeCompare(b.start));
  return save(db, characterId, { ...current, vacations });
}

/** End an open-ended pause: it covers up to yesterday (or is removed if it began today or later). */
export async function endVacation(db: Db, characterId: string, index: number, today: string) {
  const current = await loadSettings(db, characterId);
  const period = current.vacations[index];
  if (!period) throw new GameRuleError("That pause could not be found.", "VACATION_NOT_FOUND");
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const vacations = [...current.vacations];
  if (period.start > yesterday) vacations.splice(index, 1);
  else vacations[index] = { start: period.start, end: period.end && period.end < yesterday ? period.end : yesterday };
  return save(db, characterId, { ...current, vacations });
}

export async function removeVacation(db: Db, characterId: string, index: number) {
  const current = await loadSettings(db, characterId);
  if (!current.vacations[index]) throw new GameRuleError("That pause could not be found.", "VACATION_NOT_FOUND");
  return save(db, characterId, { ...current, vacations: current.vacations.filter((_, i) => i !== index) });
}

export async function patchSettings(db: Db, characterId: string, patch: Partial<Pick<CharacterSettings, "respawnDismissedUntil" | "recoveryUntil">>) {
  const current = await loadSettings(db, characterId);
  return save(db, characterId, { ...current, ...patch });
}
