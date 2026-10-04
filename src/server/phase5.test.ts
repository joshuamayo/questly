import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RESPAWN } from "@/game/config/balance";
import { activityDays, characterSkills, characters, progressionTransactions, quests, rewardRedemptions } from "./db/schema";
import { awardGp } from "./progression/service";
import { reconcileCharacter } from "./progression/service";
import { createTestCharacter } from "./testing/test-db";
import { completeQuest, createQuest, setObjectiveDone } from "./quests/service";
import { getQuestDetail } from "./queries/quests";
import { addRewardFromTemplate, createReward, getRewardShop, redeemReward, removeReward } from "./rewards/service";
import { loadBalance, updateBalance } from "./settings/service";
import { backfillActivityDays, getStreaks, grantShieldForDiary, recordActivity } from "./streaks/service";
import { continueQuest, listNeedsAttention } from "./planning/attention";
import { confirmPlan, getPlanningView, getToday, plannedWeekStart, setPlanItem } from "./planning/service";
import { beginRespawn, chooseRespawnQuest, completeRespawn, getRespawnSuggestion, respawnStats } from "./respawn/service";
import { designateBoss } from "./bosses/service";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
let c: string;
beforeEach(async () => {
  ctx = await createTestCharacter();
  c = ctx.character.id;
});
afterEach(async () => {
  await ctx.close();
});

// 2026-10-05 is a Monday.
const NOW = new Date("2026-10-05T12:00:00Z");
const TODAY = "2026-10-05";

async function char() {
  const [row] = await ctx.db.select().from(characters).where(eq(characters.id, c));
  return row;
}
async function quest(over: Record<string, unknown> = {}) {
  return createQuest(ctx.db, c, { title: "Clean the garage", skillKey: "home", difficulty: "NOVICE", objectives: ["Sort", "Sweep"], ...over });
}
async function finish(questId: string) {
  const d = await getQuestDetail(ctx.db, c, questId);
  for (const o of d.objectives) await setObjectiveDone(ctx.db, c, questId, o.id, true, { localDate: TODAY, now: NOW });
  return completeQuest(ctx.db, c, questId, { localDate: TODAY, now: NOW });
}

describe("Reward Shop", () => {
  it("redeems atomically, once per request, and never goes negative", async () => {
    await awardGp(ctx.db, c, 40, { sourceType: "SYSTEM", idempotencyKey: "grant" });
    const reward = await createReward(ctx.db, c, { name: "Gaming Afternoon", category: "GAMING", gpCost: 30, repeatable: true });

    const first = await redeemReward(ctx.db, c, reward.id, "request-0001");
    expect(first).toMatchObject({ duplicate: false, gpCost: 30, gpBalance: 10, rewardName: "Gaming Afternoon" });
    const again = await redeemReward(ctx.db, c, reward.id, "request-0001");
    expect(again).toMatchObject({ duplicate: true, gpBalance: 10, redemptionId: first.redemptionId });

    await expect(redeemReward(ctx.db, c, reward.id, "request-0002")).rejects.toThrow(/Not enough GP/);
    expect((await char()).gpBalance).toBe(10);
    expect(await ctx.db.select().from(rewardRedemptions)).toHaveLength(1);
    expect((await char()).lifetimeGpSpent).toBe(30);
    expect((await reconcileCharacter(ctx.db, c)).consistent).toBe(true);
  });

  it("one-time rewards can be claimed once and are archived", async () => {
    await awardGp(ctx.db, c, 100, { sourceType: "SYSTEM", idempotencyKey: "grant" });
    const reward = await createReward(ctx.db, c, { name: "Concert", category: "EXPERIENCES", gpCost: 20, repeatable: false });
    await redeemReward(ctx.db, c, reward.id, "request-a001");
    await expect(redeemReward(ctx.db, c, reward.id, "request-a002")).rejects.toThrow(/archived|already/);
    expect((await char()).gpBalance).toBe(80);
  });

  it("redeemed rewards are archived, not deleted; unused ones can be removed", async () => {
    await awardGp(ctx.db, c, 100, { sourceType: "SYSTEM", idempotencyKey: "grant" });
    const used = await addRewardFromTemplate(ctx.db, c, "gaming-hour");
    const unused = await addRewardFromTemplate(ctx.db, c, "new-game");
    await redeemReward(ctx.db, c, used.id, "request-b001");
    expect(await removeReward(ctx.db, c, used.id)).toEqual({ archived: true });
    expect(await removeReward(ctx.db, c, unused.id)).toEqual({ archived: false });
    const shop = await getRewardShop(ctx.db, c);
    expect(shop.rewards.map((r) => [r.name, r.active, r.timesRedeemed])).toEqual([["1 Hour Guilt-Free Gaming", false, 1]]);
    expect(shop.history[0]).toMatchObject({ rewardNameSnapshot: "1 Hour Guilt-Free Gaming", gpCostSnapshot: 10 });
    expect(shop.templates.some((t) => t.key === "gaming-hour")).toBe(false);
  });
});

describe("Game Balance settings", () => {
  it("apply to newly accepted Quests only", async () => {
    const before = await quest();
    await updateBalance(ctx.db, c, { questRewards: { NOVICE: { xp: 300, gp: 9, qp: 1 } }, mainQuestCap: 1 });
    const after = await quest({ title: "Second" });
    expect([before.rewardXp, before.rewardGp]).toEqual([100, 2]);
    expect([after.rewardXp, after.rewardGp]).toEqual([300, 9]);
    await quest({ title: "Main one", priority: "MAIN" });
    await expect(quest({ title: "Main two", priority: "MAIN" })).rejects.toThrow(/1 Main Quests/);
  });

  it("snapshot the configured Boss bounty", async () => {
    await updateBalance(ctx.db, c, { bounty: { earlyGp: 77 } });
    const q = await quest();
    const boss = await designateBoss(ctx.db, c, q.id);
    expect(boss.bounty).toMatchObject({ earlyGp: 77, byTargetGp: 20 });
    expect((await loadBalance(ctx.db, c)).bounty.earlyGp).toBe(77);
  });

  it("reject invalid values", async () => {
    await expect(updateBalance(ctx.db, c, { mainQuestCap: 0 })).rejects.toThrow();
  });
});

describe("Streaks and shields", () => {
  it("records activity from objectives and Quest completion", async () => {
    const q = await quest();
    await finish(q.id);
    const days = await ctx.db.select().from(activityDays).where(eq(activityDays.characterId, c));
    expect(days.map((d) => d.day)).toEqual([TODAY]);
    expect((await getStreaks(ctx.db, c, TODAY)).adventure).toMatchObject({ current: 1, activeToday: true });
  });

  it("shields cover a missed workday when the player returns", async () => {
    await recordActivity(ctx.db, c, "2026-10-01"); // Thu
    await grantShieldForDiary(ctx.db, c, "MONTHLY", "HARD");
    // Fri 10-02 missed. Monday: preview shows the streak held, one shield pending.
    const preview = await getStreaks(ctx.db, c, TODAY);
    expect(preview).toMatchObject({ shields: 1, pendingShields: 1 });
    expect(preview.adventure.current).toBe(1);
    await recordActivity(ctx.db, c, TODAY);
    const after = await getStreaks(ctx.db, c, TODAY);
    expect(after).toMatchObject({ shields: 0, pendingShields: 0 });
    expect(after.adventure.current).toBe(2);
  });

  it("shields are not spent when they cannot cover the gap, and are capped", async () => {
    await recordActivity(ctx.db, c, "2026-09-28");
    await grantShieldForDiary(ctx.db, c, "WEEKLY", "ELITE");
    expect(await grantShieldForDiary(ctx.db, c, "WEEKLY", "EASY")).toBe(false);
    await recordActivity(ctx.db, c, TODAY); // 4 missed workdays, 1 shield
    expect((await char()).streakShields).toBe(1);
    expect((await getStreaks(ctx.db, c, TODAY)).adventure.current).toBe(1);
    for (let i = 0; i < 5; i++) await grantShieldForDiary(ctx.db, c, "MONTHLY", "ELITE");
    expect((await char()).streakShields).toBe(3);
  });

  it("backfills activity days from earlier history without duplicates", async () => {
    const q = await quest();
    await finish(q.id);
    await ctx.db.delete(activityDays);
    expect(await backfillActivityDays(ctx.db, c, 30)).toBeGreaterThan(0);
    await backfillActivityDays(ctx.db, c, 30);
    const days = await ctx.db.select().from(activityDays);
    expect(days.map((d) => d.day)).toContain(TODAY);
    expect(new Set(days.map((d) => d.day)).size).toBe(days.length);
  });

  it("deadline streak counts on-time completions", async () => {
    const a = await quest({ deadline: "2026-10-10" });
    await finish(a.id);
    expect((await getStreaks(ctx.db, c, TODAY)).deadline).toEqual({ current: 1, best: 1 });
  });
});

describe("Quests Need Attention", () => {
  it("lists overdue active Quests and continues them without losing the original date", async () => {
    const q = await quest({ targetDate: "2026-10-01", deadline: "2026-10-03" });
    const list = await listNeedsAttention(ctx.db, c, TODAY);
    expect(list.map((x) => [x.id, x.reason])).toEqual([[q.id, "PAST_DEADLINE"]]);
    await expect(continueQuest(ctx.db, c, q.id, { targetDate: "2026-10-08" }, TODAY)).rejects.toThrow(/deadline has passed/);
    await continueQuest(ctx.db, c, q.id, { targetDate: "2026-10-08", deadline: "2026-10-12" }, TODAY);
    expect(await listNeedsAttention(ctx.db, c, TODAY)).toHaveLength(0);
    const detail = await getQuestDetail(ctx.db, c, q.id);
    expect(detail.dateHistory.map((h) => [h.field, h.oldValue, h.newValue, h.reason])).toEqual([
      ["TARGET", "2026-10-01", "2026-10-08", "CONTINUE"],
      ["DEADLINE", "2026-10-03", "2026-10-12", "CONTINUE"],
    ]);
  });
});

describe("Weekly Planning", () => {
  it("plans the upcoming week from the last day of the week", () => {
    expect(plannedWeekStart("2026-10-04", 1)).toBe("2026-10-05"); // Sunday → next Monday
    expect(plannedWeekStart("2026-10-07", 1)).toBe("2026-10-05");
  });

  it("allocates Quests to days and recommends today's plan", async () => {
    const a = await quest({ title: "Planned" });
    await quest({ title: "Main", priority: "MAIN" });
    await setPlanItem(ctx.db, c, { weekStart: "2026-10-05", day: TODAY, questId: a.id, planned: true }, TODAY);
    await confirmPlan(ctx.db, c, "2026-10-05", TODAY);
    const view = await getPlanningView(ctx.db, c, TODAY);
    expect(view).toMatchObject({ weekStart: "2026-10-05", confirmed: true });
    expect(view.allocation[a.id]).toEqual([TODAY]);
    const today = await getToday(ctx.db, c, TODAY);
    expect(today.recommendations[0]).toMatchObject({ id: a.id, reason: "Planned for today." });
    expect(today.weekPlanned).toBe(true);
    await expect(setPlanItem(ctx.db, c, { weekStart: "2026-11-02", day: "2026-11-02", questId: a.id, planned: true }, TODAY)).rejects.toThrow();
  });
});

describe("Respawn", () => {
  it("never removes permanent progression and grants a one-time comeback bonus", async () => {
    const first = await quest();
    await finish(first.id);
    const before = await char();
    const xpBefore = await ctx.db.select().from(characterSkills).where(eq(characterSkills.characterId, c));

    const q = await quest({ title: "Respawn Quest", targetDate: "2026-09-01" });
    await beginRespawn(ctx.db, c, "MANUAL");
    await expect(completeRespawn(ctx.db, c, TODAY)).rejects.toThrow(/Respawn Quest/);
    await chooseRespawnQuest(ctx.db, c, q.id);
    await completeRespawn(ctx.db, c, TODAY);

    const after = await char();
    expect([after.gpBalance, after.questPoints, after.combatPoints]).toEqual([before.gpBalance, before.questPoints, before.combatPoints]);
    const xpAfter = await ctx.db.select().from(characterSkills).where(eq(characterSkills.characterId, c));
    expect(xpAfter).toEqual(xpBefore);
    expect(await respawnStats(ctx.db, c)).toEqual({ deaths: 1, respawns: 1 });
    expect((await getToday(ctx.db, c, TODAY)).inRecovery).toBe(true);
    expect((await getToday(ctx.db, c, TODAY)).recommendations).toHaveLength(1);

    const done = await finish(q.id);
    expect(done.comeback).toEqual({ xp: RESPAWN.comebackFocusXp });
    const bonus = await ctx.db.select().from(progressionTransactions).where(eq(progressionTransactions.idempotencyKey, `quest:${q.id}:respawn`));
    expect(bonus).toHaveLength(1);
    expect((await completeQuest(ctx.db, c, q.id, { localDate: TODAY, now: NOW })).duplicate).toBe(true);
    expect(await ctx.db.select().from(progressionTransactions).where(eq(progressionTransactions.idempotencyKey, `quest:${q.id}:respawn`))).toHaveLength(1);
  });

  it("is suggested at the thresholds and can be dismissed", async () => {
    for (let i = 0; i < 5; i++) await quest({ title: `Q${i}`, targetDate: "2026-09-20" });
    expect((await getRespawnSuggestion(ctx.db, c, TODAY)).trigger).toBe("QUESTS_NEED_ATTENTION");
    const { dismissRespawn } = await import("./respawn/service");
    await dismissRespawn(ctx.db, c, TODAY);
    expect((await getRespawnSuggestion(ctx.db, c, TODAY)).suggested).toBe(false);
    expect(await ctx.db.select().from(quests)).toHaveLength(5);
  });
});
