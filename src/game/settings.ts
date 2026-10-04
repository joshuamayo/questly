/**
 * Character settings (Product Spec §26), stored as JSON on the character and
 * always normalized on read. Game Balance overrides are validated and merged
 * with the defaults; accepted Quests keep their snapshotted rewards.
 */

import { BOSS_BOUNTY, FOCUS_XP, MAIN_QUEST_CAP, QUEST_REWARDS, RESPAWN_THRESHOLDS, type QuestReward } from "./config/balance";
import { GameRuleError } from "./errors";
import { QUEST_DIFFICULTIES, type QuestDifficulty } from "./vocabulary";

export type VacationPeriod = { start: string; end: string | null };

export type BountyValues = { earlyGp: number; byTargetGp: number; byDeadlineGp: number; lateGp: number };
export type RespawnValues = { missedPlannedWorkdays: number; questsNeedingAttention: number };

export type BalanceOverrides = {
  questRewards?: Partial<Record<QuestDifficulty, QuestReward>>;
  mainQuestCap?: number;
  focusDailyXpCap?: number;
  bounty?: Partial<BountyValues>;
  respawn?: Partial<RespawnValues>;
};

export type CharacterSettings = {
  /** 0 = Sunday … 6 = Saturday. */
  weekStart: number;
  /** Planned workdays (0–6). Non-workdays never break streaks. */
  workdays: number[];
  planningDay: number;
  vacations: VacationPeriod[];
  focusDefaultMinutes: number;
  /** Motion preference: follow the OS, always reduce, or allow full motion. */
  motion: "system" | "reduce" | "full";
  balance: BalanceOverrides;
  /** Respawn suggestion hidden until this date (dismissal). */
  respawnDismissedUntil: string | null;
  /** Recovery week after a Respawn: recommendations are lighter until this date. */
  recoveryUntil: string | null;
};

export const DEFAULT_SETTINGS: CharacterSettings = {
  weekStart: 1,
  workdays: [1, 2, 3, 4, 5],
  planningDay: 0,
  vacations: [],
  focusDefaultMinutes: 25,
  motion: "system",
  balance: {},
  respawnDismissedUntil: null,
  recoveryUntil: null,
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const day = (v: unknown, fallback: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 6 ? (v as number) : fallback);
const isoOrNull = (v: unknown) => (typeof v === "string" && ISO.test(v) ? v : null);

/** Accept unknown JSON from storage and return complete, safe settings. */
export function normalizeSettings(value: unknown): CharacterSettings {
  const v = (value ?? {}) as Record<string, unknown>;
  const workdays = Array.isArray(v.workdays)
    ? [...new Set(v.workdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) as number[])].sort()
    : DEFAULT_SETTINGS.workdays;
  const vacations = Array.isArray(v.vacations)
    ? (v.vacations as Record<string, unknown>[])
        .map((p) => ({ start: isoOrNull(p?.start), end: isoOrNull(p?.end) }))
        .filter((p): p is VacationPeriod => p.start !== null)
    : [];
  return {
    weekStart: day(v.weekStart, DEFAULT_SETTINGS.weekStart),
    workdays,
    planningDay: day(v.planningDay, DEFAULT_SETTINGS.planningDay),
    vacations,
    focusDefaultMinutes: FOCUS_XP.timerPresetsMinutes.includes(v.focusDefaultMinutes as 25) ? (v.focusDefaultMinutes as number) : 25,
    motion: v.motion === "reduce" || v.motion === "full" ? v.motion : "system",
    balance: typeof v.balance === "object" && v.balance ? (v.balance as BalanceOverrides) : {},
    respawnDismissedUntil: isoOrNull(v.respawnDismissedUntil),
    recoveryUntil: isoOrNull(v.recoveryUntil),
  };
}

export function isOnVacation(settings: Pick<CharacterSettings, "vacations">, date: string): boolean {
  return settings.vacations.some((p) => date >= p.start && (p.end === null || date <= p.end));
}

export function isWorkday(settings: Pick<CharacterSettings, "workdays">, date: string): boolean {
  return settings.workdays.includes(new Date(`${date}T00:00:00Z`).getUTCDay());
}

// ---------------------------------------------------------------------------
// Game Balance
// ---------------------------------------------------------------------------

export type EffectiveBalance = {
  questRewards: Record<QuestDifficulty, QuestReward>;
  mainQuestCap: number;
  focusDailyXpCap: number;
  bounty: BountyValues;
  respawn: RespawnValues;
};

const LIMITS = { xp: 1_000_000, gp: 100_000, qp: 1_000 };

function whole(v: unknown, min: number, max: number, label: string): number {
  if (!Number.isInteger(v) || (v as number) < min || (v as number) > max) {
    throw new GameRuleError(`${label} must be a whole number from ${min} to ${max.toLocaleString("en-US")}.`, "INVALID_BALANCE");
  }
  return v as number;
}

/** Validate overrides strictly (for saving). Throws on bad values. */
export function validateBalanceOverrides(o: BalanceOverrides): BalanceOverrides {
  const out: BalanceOverrides = {};
  if (o.questRewards) {
    out.questRewards = {};
    for (const d of QUEST_DIFFICULTIES) {
      const r = o.questRewards[d];
      if (!r) continue;
      out.questRewards[d] = {
        xp: whole(r.xp, 0, LIMITS.xp, `${d} XP`),
        gp: whole(r.gp, 0, LIMITS.gp, `${d} GP`),
        qp: whole(r.qp, 0, LIMITS.qp, `${d} QP`),
      };
    }
  }
  if (o.mainQuestCap !== undefined) out.mainQuestCap = whole(o.mainQuestCap, 1, 10, "Main Quest cap");
  if (o.focusDailyXpCap !== undefined) out.focusDailyXpCap = whole(o.focusDailyXpCap, 0, 10_000, "Daily Focus XP cap");
  if (o.bounty) {
    out.bounty = {};
    for (const k of ["earlyGp", "byTargetGp", "byDeadlineGp", "lateGp"] as const) {
      if (o.bounty[k] !== undefined) out.bounty[k] = whole(o.bounty[k], 0, LIMITS.gp, "Bounty GP");
    }
  }
  if (o.respawn) {
    out.respawn = {};
    if (o.respawn.missedPlannedWorkdays !== undefined) out.respawn.missedPlannedWorkdays = whole(o.respawn.missedPlannedWorkdays, 1, 60, "Missed workdays threshold");
    if (o.respawn.questsNeedingAttention !== undefined) out.respawn.questsNeedingAttention = whole(o.respawn.questsNeedingAttention, 1, 100, "Quests needing attention threshold");
  }
  return out;
}

/** Merge overrides over defaults, ignoring anything invalid. */
export function effectiveBalance(overrides: BalanceOverrides | undefined): EffectiveBalance {
  let o: BalanceOverrides = {};
  try {
    o = validateBalanceOverrides(overrides ?? {});
  } catch {
    o = {};
  }
  return {
    questRewards: Object.fromEntries(QUEST_DIFFICULTIES.map((d) => [d, { ...QUEST_REWARDS[d], ...(o.questRewards?.[d] ?? {}) }])) as Record<QuestDifficulty, QuestReward>,
    mainQuestCap: o.mainQuestCap ?? MAIN_QUEST_CAP,
    focusDailyXpCap: o.focusDailyXpCap ?? FOCUS_XP.dailyXpCap,
    bounty: { ...BOSS_BOUNTY, ...(o.bounty ?? {}) },
    respawn: { ...RESPAWN_THRESHOLDS, ...(o.respawn ?? {}) },
  };
}
