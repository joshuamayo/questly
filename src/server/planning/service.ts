/**
 * Weekly Planning — "preparing an expedition" (Product Spec §19). The plan
 * holds a rough allocation of Quests to days; it is never a minute-by-minute
 * calendar. A confirmed week feeds the daily recommendation on World.
 */

import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { periodFor, type WeekStart } from "@/game/diaries";
import { GameRuleError } from "@/game/errors";
import { addDays, inRecovery, recommendedLimit, recommendQuests, weekDates } from "@/game/planning";
import { isActiveStatus } from "@/game/quests";
import type { Db } from "../db/client";
import { activityEvents, diaryClaims, focusSessions, progressionTransactions, quests, weeklyPlanItems, weeklyPlans } from "../db/schema";
import { listQuests, type QuestSummary } from "../queries/quests";
import { loadSettings } from "../settings/service";

/**
 * The week to plan: the week containing today, or the next one when today is
 * the last day of the week (planning on Sunday for a Monday start).
 */
export function plannedWeekStart(today: string, weekStart: number): string {
  const current = periodFor("WEEKLY", today, weekStart as WeekStart);
  return addDays(today, 1) === current.end ? current.end : current.start;
}

export async function getWeekStartFor(db: Db, characterId: string, today: string) {
  const settings = await loadSettings(db, characterId);
  return { settings, weekStart: plannedWeekStart(today, settings.weekStart) };
}

async function planFor(db: Db, characterId: string, weekStart: string) {
  const [plan] = await db.select().from(weeklyPlans).where(and(eq(weeklyPlans.characterId, characterId), eq(weeklyPlans.weekStart, weekStart)));
  return plan ?? null;
}

async function ensurePlan(db: Db, characterId: string, weekStart: string) {
  await db.insert(weeklyPlans).values({ characterId, weekStart }).onConflictDoNothing();
  return (await planFor(db, characterId, weekStart))!;
}

/** Only the current or upcoming week can be planned. */
async function assertPlannableWeek(db: Db, characterId: string, weekStart: string, today: string) {
  const settings = await loadSettings(db, characterId);
  const current = periodFor("WEEKLY", today, settings.weekStart as WeekStart);
  if (weekStart !== current.start && weekStart !== current.end) {
    throw new GameRuleError("Only this week or next week can be planned.", "WEEK_NOT_PLANNABLE");
  }
}

export async function setPlanItem(db: Db, characterId: string, input: { weekStart: string; day: string; questId: string; planned: boolean }, today: string) {
  await assertPlannableWeek(db, characterId, input.weekStart, today);
  if (!weekDates(input.weekStart).includes(input.day)) throw new GameRuleError("That day is outside this week.", "DAY_OUTSIDE_WEEK");
  const [quest] = await db.select({ status: quests.status }).from(quests).where(and(eq(quests.id, input.questId), eq(quests.characterId, characterId)));
  if (!quest || !isActiveStatus(quest.status)) throw new GameRuleError("Only active Quests can be planned.", "QUEST_NOT_ACTIVE");
  const plan = await ensurePlan(db, characterId, input.weekStart);
  if (input.planned) {
    await db.insert(weeklyPlanItems).values({ planId: plan.id, day: input.day, questId: input.questId }).onConflictDoNothing();
  } else {
    await db
      .delete(weeklyPlanItems)
      .where(and(eq(weeklyPlanItems.planId, plan.id), eq(weeklyPlanItems.day, input.day), eq(weeklyPlanItems.questId, input.questId)));
  }
}

export async function confirmPlan(db: Db, characterId: string, weekStart: string, today: string) {
  await assertPlannableWeek(db, characterId, weekStart, today);
  const plan = await ensurePlan(db, characterId, weekStart);
  if (!plan.confirmedAt) {
    await db.update(weeklyPlans).set({ confirmedAt: new Date() }).where(eq(weeklyPlans.id, plan.id));
    await db.insert(activityEvents).values({ characterId, type: "ADVENTURE_BEGUN", entityId: plan.id, payload: { weekStart } });
  }
}

export type WeekRecap = {
  start: string;
  end: string;
  quests: { id: string; title: string; difficulty: string }[];
  xp: number;
  gp: number;
  qp: number;
  focusMinutes: number;
  diaryTiers: number;
};

async function recapFor(db: Db, characterId: string, start: string, end: string): Promise<WeekRecap> {
  // Older completions may predate the stored local date; fall back to the UTC date.
  const completedDay = sql<string>`coalesce(${quests.completedLocalDate}, (${quests.completedAt} at time zone 'UTC')::date)`;
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(`${end}T00:00:00Z`);
  const [completed, ledger, focus, claims] = await Promise.all([
    db
      .select({ id: quests.id, title: quests.title, difficulty: quests.difficulty })
      .from(quests)
      .where(and(eq(quests.characterId, characterId), eq(quests.status, "COMPLETED"), gte(completedDay, start), lt(completedDay, end))),
    db
      .select({ kind: progressionTransactions.kind, total: sql<number>`coalesce(sum(${progressionTransactions.amount}), 0)::int` })
      .from(progressionTransactions)
      .where(
        and(
          eq(progressionTransactions.characterId, characterId),
          gte(progressionTransactions.createdAt, from),
          lt(progressionTransactions.createdAt, to),
          ne(progressionTransactions.sourceType, "SEED_DEMO"),
          ne(progressionTransactions.sourceType, "REWARD_REDEMPTION"),
        ),
      )
      .groupBy(progressionTransactions.kind),
    db
      .select({ minutes: sql<number>`coalesce(sum(${focusSessions.qualifyingMinutes}), 0)::int` })
      .from(focusSessions)
      .where(and(eq(focusSessions.characterId, characterId), eq(focusSessions.status, "COMPLETED"), gte(focusSessions.endedAt, from), lt(focusSessions.endedAt, to))),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(diaryClaims)
      .where(and(eq(diaryClaims.characterId, characterId), gte(diaryClaims.claimedAt, from), lt(diaryClaims.claimedAt, to))),
  ]);
  const sum = (k: string) => ledger.find((l) => l.kind === k)?.total ?? 0;
  return { start, end, quests: completed, xp: sum("XP"), gp: sum("GP"), qp: sum("QP"), focusMinutes: focus[0]?.minutes ?? 0, diaryTiers: claims[0]?.n ?? 0 };
}

export type PlanningView = {
  weekStart: string;
  days: string[];
  confirmed: boolean;
  recap: WeekRecap;
  active: QuestSummary[];
  /** questId → days it is planned for. */
  allocation: Record<string, string[]>;
  inRecovery: boolean;
};

export async function getPlanningView(db: Db, characterId: string, today: string): Promise<PlanningView> {
  const { settings, weekStart } = await getWeekStartFor(db, characterId, today);
  const [plan, active, recap] = await Promise.all([
    planFor(db, characterId, weekStart),
    listQuests(db, characterId, "active"),
    recapFor(db, characterId, addDays(weekStart, -7), weekStart),
  ]);
  const items = plan ? await db.select().from(weeklyPlanItems).where(eq(weeklyPlanItems.planId, plan.id)) : [];
  const allocation: Record<string, string[]> = {};
  for (const i of items) (allocation[i.questId] ??= []).push(i.day);
  return {
    weekStart,
    days: weekDates(weekStart),
    confirmed: Boolean(plan?.confirmedAt),
    recap,
    active,
    allocation,
    inRecovery: inRecovery(settings.recoveryUntil, today),
  };
}

export type TodayView = {
  recommendations: (QuestSummary & { reason: string })[];
  inRecovery: boolean;
  /** Show the weekly planning prompt (planning day, or the week has no confirmed plan yet). */
  planningDue: boolean;
  weekPlanned: boolean;
};

export async function getToday(db: Db, characterId: string, today: string): Promise<TodayView> {
  const settings = await loadSettings(db, characterId);
  const currentWeek = periodFor("WEEKLY", today, settings.weekStart as WeekStart).start;
  const upcoming = plannedWeekStart(today, settings.weekStart);
  const [active, currentPlan, upcomingPlan] = await Promise.all([
    listQuests(db, characterId, "active"),
    planFor(db, characterId, currentWeek),
    upcoming === currentWeek ? Promise.resolve(null) : planFor(db, characterId, upcoming),
  ]);
  const plannedToday = new Set(
    currentPlan
      ? (await db.select({ questId: weeklyPlanItems.questId }).from(weeklyPlanItems).where(and(eq(weeklyPlanItems.planId, currentPlan.id), eq(weeklyPlanItems.day, today)))).map((r) => r.questId)
      : [],
  );
  const recovering = inRecovery(settings.recoveryUntil, today);
  const recs = recommendQuests(
    active.map((q) => ({ ...q, plannedToday: plannedToday.has(q.id), progressPercent: q.progress.percent })),
    today,
    recommendedLimit(recovering),
  );
  const byId = new Map(active.map((q) => [q.id, q]));
  const upcomingConfirmed = Boolean((upcoming === currentWeek ? currentPlan : upcomingPlan)?.confirmedAt);
  const isPlanningDay = new Date(`${today}T00:00:00Z`).getUTCDay() === settings.planningDay;
  return {
    recommendations: recs.map((r) => ({ ...byId.get(r.id)!, reason: r.reason })),
    inRecovery: recovering,
    planningDue: active.length > 0 && !upcomingConfirmed && (isPlanningDay || !currentPlan?.confirmedAt),
    weekPlanned: Boolean(currentPlan?.confirmedAt),
  };
}

/** Quest ids planned on any day this week (for the Quest Journal). */
export async function plannedQuestIds(db: Db, characterId: string, weekStart: string) {
  const plan = await planFor(db, characterId, weekStart);
  if (!plan) return new Set<string>();
  const rows = await db.select({ questId: weeklyPlanItems.questId }).from(weeklyPlanItems).where(eq(weeklyPlanItems.planId, plan.id));
  return new Set(rows.map((r) => r.questId));
}

