import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { characters, gpTransactions, quests, rewardRedemptions } from "./db/schema";
import { createTestCharacter } from "./testing/test-db";
import { earnGp, reconcileGp, spendGp } from "./gp/service";
import { activeQuests, archiveQuest, completeQuest, createQuest, moveQuest, reorderQuests, restoreQuest, updateQuest } from "./quests/service";
import { getCompleted, getQuestLog } from "./queries";
import { addSuggestedRewards, createReward, redeemReward, setFeaturedGoal, setRewardActive } from "./rewards/service";
import { updateSettings } from "./settings/service";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
let c: string;
beforeEach(async () => {
  ctx = await createTestCharacter();
  c = ctx.character.id;
});
afterEach(async () => {
  await ctx.close();
});

async function char() {
  const [row] = await ctx.db.select().from(characters).where(eq(characters.id, c));
  return row;
}
async function order() {
  return (await activeQuests(ctx.db, c)).map((q) => q.title);
}
async function positions() {
  return (await activeQuests(ctx.db, c)).map((q) => q.position);
}
async function seed(...titles: string[]) {
  const out = [];
  for (const title of titles) out.push(await createQuest(ctx.db, c, { title }));
  return out;
}

describe("Quest Log ordering", () => {
  it("adds to the end by default, or next / top", async () => {
    await seed("Q1", "Q2");
    await createQuest(ctx.db, c, { title: "Top", position: "top" });
    await createQuest(ctx.db, c, { title: "Next", position: "next" });
    expect(await order()).toEqual(["Top", "Next", "Q1", "Q2"]);
    expect(await positions()).toEqual([0, 1, 2, 3]);
  });

  it("uses the configured default GP", async () => {
    await updateSettings(ctx.db, c, { defaultQuestGp: 25 });
    const [q] = await seed("Q1");
    expect(q.gpReward).toBe(25);
    expect((await createQuest(ctx.db, c, { title: "Q2", gpReward: 50 })).gpReward).toBe(50);
  });

  it("first active is Current, later are Locked, completed are ignored", async () => {
    const [q1] = await seed("Q1", "Q2", "Q3");
    await completeQuest(ctx.db, c, q1.id);
    const log = await getQuestLog(ctx.db, c, 0);
    expect(log.current?.title).toBe("Q2");
    expect(log.locked.map((q) => q.title)).toEqual(["Q3"]);
    expect(log.recent.map((q) => q.title)).toEqual(["Q1"]);
  });

  it("reordering changes Current and keeps positions contiguous", async () => {
    const [, , , q4] = await seed("Q1", "Q2", "Q3", "Q4");
    await moveQuest(ctx.db, c, q4.id, 0);
    expect(await order()).toEqual(["Q4", "Q1", "Q2", "Q3"]);
    expect(await positions()).toEqual([0, 1, 2, 3]);
    expect((await getQuestLog(ctx.db, c, 0)).current?.title).toBe("Q4");
  });

  it("applies a full drag-and-drop order and rejects stale ones", async () => {
    const [a, b, d] = await seed("A", "B", "D");
    await reorderQuests(ctx.db, c, [d.id, a.id, b.id]);
    expect(await order()).toEqual(["D", "A", "B"]);
    await expect(reorderQuests(ctx.db, c, [a.id, b.id])).rejects.toThrow(/changed/);
    await expect(reorderQuests(ctx.db, c, [a.id, a.id, b.id])).rejects.toThrow(/changed/);
    expect(await order()).toEqual(["D", "A", "B"]);
  });

  it("archiving removes a quest without reward and restore puts it at the end", async () => {
    const [q1, q2] = await seed("Q1", "Q2", "Q3");
    await archiveQuest(ctx.db, c, q1.id);
    expect(await order()).toEqual(["Q2", "Q3"]);
    expect(await positions()).toEqual([0, 1]);
    await restoreQuest(ctx.db, c, q1.id);
    expect(await order()).toEqual(["Q2", "Q3", "Q1"]);
    expect((await char()).gpBalance).toBe(0);
    await updateQuest(ctx.db, c, q2.id, { title: "Q2 renamed", gpReward: 40 });
    expect(await order()).toEqual(["Q2 renamed", "Q3", "Q1"]);
  });
});

describe("Completion", () => {
  it("only the Current Quest completes; locked quests are rejected", async () => {
    const [q1, q2] = await seed("Q1", "Q2");
    await expect(completeQuest(ctx.db, c, q2.id)).rejects.toThrow("This quest isn't next. Reorder it first if you want to work on it now.");
    expect((await char()).gpBalance).toBe(0);
    const done = await completeQuest(ctx.db, c, q1.id);
    expect(done).toMatchObject({ duplicate: false, gpEarned: 10, gpBalance: 10, next: { title: "Q2" } });
  });

  it("awards GP exactly once; repeating is safe", async () => {
    const [q1] = await seed("Q1", "Q2");
    await completeQuest(ctx.db, c, q1.id);
    const again = await completeQuest(ctx.db, c, q1.id);
    expect(again).toMatchObject({ duplicate: true, gpEarned: 0, gpBalance: 10, next: { title: "Q2" } });
    const tx = await ctx.db.select().from(gpTransactions).where(eq(gpTransactions.characterId, c));
    expect(tx).toHaveLength(1);
    expect(tx[0]).toMatchObject({ amount: 10, transactionType: "EARN", sourceType: "QUEST", sourceId: q1.id, description: "Q1" });
    expect((await reconcileGp(ctx.db, c)).consistent).toBe(true);
  });

  it("the next quest becomes Current; completed history can't be edited", async () => {
    const [q1, q2] = await seed("Q1", "Q2", "Q3");
    await completeQuest(ctx.db, c, q1.id);
    await completeQuest(ctx.db, c, q2.id);
    expect(await order()).toEqual(["Q3"]);
    expect(await positions()).toEqual([0]);
    await expect(updateQuest(ctx.db, c, q1.id, { title: "x" })).rejects.toThrow(/history/);
    await expect(archiveQuest(ctx.db, c, q1.id)).rejects.toThrow();
    const completed = await getCompleted(ctx.db, c, {});
    expect(completed.items.map((q) => q.title)).toEqual(["Q2", "Q1"]);
    expect(completed.total).toBe(2);
  });

  it("archived quests can't be completed", async () => {
    const [q1] = await seed("Q1");
    await archiveQuest(ctx.db, c, q1.id);
    await expect(completeQuest(ctx.db, c, q1.id)).rejects.toThrow(/removed/);
  });

  it("zero-GP quests complete without a ledger entry", async () => {
    const q = await createQuest(ctx.db, c, { title: "Free", gpReward: 0 });
    expect((await completeQuest(ctx.db, c, q.id)).gpEarned).toBe(0);
    expect(await ctx.db.select().from(gpTransactions)).toHaveLength(0);
  });
});

describe("GP ledger", () => {
  it("earns and spends, never going negative", async () => {
    await earnGp(ctx.db, c, 30, { sourceType: "SYSTEM", description: "test", idempotencyKey: "grant-1" });
    expect((await earnGp(ctx.db, c, 30, { sourceType: "SYSTEM", description: "test", idempotencyKey: "grant-1" })).duplicate).toBe(true);
    await spendGp(ctx.db, c, 20, { sourceType: "SYSTEM", description: "test", idempotencyKey: "spend-1" });
    await expect(spendGp(ctx.db, c, 20, { sourceType: "SYSTEM", description: "test", idempotencyKey: "spend-2" })).rejects.toThrow(/You need 20 GP/);
    expect(await char()).toMatchObject({ gpBalance: 10, lifetimeGpEarned: 30, lifetimeGpSpent: 20 });
    expect((await reconcileGp(ctx.db, c)).consistent).toBe(true);
  });
});

describe("Rewards", () => {
  async function fund(amount: number) {
    await earnGp(ctx.db, c, amount, { sourceType: "SYSTEM", description: "test", idempotencyKey: `fund-${amount}` });
  }

  it("redeems a repeatable reward with a recorded transaction, once per request", async () => {
    await fund(40);
    const r = await createReward(ctx.db, c, { name: "Gaming Afternoon", gpCost: 15, repeatable: true });
    const first = await redeemReward(ctx.db, c, r.id, "request-0001");
    expect(first).toMatchObject({ duplicate: false, gpCost: 15, gpBalance: 25 });
    expect((await redeemReward(ctx.db, c, r.id, "request-0001")).duplicate).toBe(true);
    await redeemReward(ctx.db, c, r.id, "request-0002");
    await expect(redeemReward(ctx.db, c, r.id, "request-0003")).rejects.toThrow(/You need 15 GP/);
    expect((await char()).gpBalance).toBe(10);
    expect(await ctx.db.select().from(rewardRedemptions)).toHaveLength(2);
    const spends = await ctx.db.select().from(gpTransactions).where(eq(gpTransactions.transactionType, "SPEND"));
    expect(spends.map((t) => [t.amount, t.sourceType])).toEqual([
      [-15, "REWARD"],
      [-15, "REWARD"],
    ]);
  });

  it("one-time rewards retire after redemption", async () => {
    await fund(100);
    const r = await createReward(ctx.db, c, { name: "Concert", gpCost: 30, repeatable: false });
    await setFeaturedGoal(ctx.db, c, r.id);
    await redeemReward(ctx.db, c, r.id, "request-a001");
    await expect(redeemReward(ctx.db, c, r.id, "request-a002")).rejects.toThrow(/archived|claimed/);
    await expect(setRewardActive(ctx.db, c, r.id, true)).rejects.toThrow(/claimed/);
    expect((await getQuestLog(ctx.db, c, 70)).savingsGoal).toBeNull();
  });

  it("has at most one savings goal", async () => {
    const a = await createReward(ctx.db, c, { name: "Monitor", gpCost: 300, repeatable: true });
    const b = await createReward(ctx.db, c, { name: "Lunch", gpCost: 25, repeatable: true });
    await setFeaturedGoal(ctx.db, c, a.id);
    await setFeaturedGoal(ctx.db, c, b.id);
    expect((await getQuestLog(ctx.db, c, 10)).savingsGoal).toMatchObject({ name: "Lunch", current: 10, target: 25, percent: 40 });
    await setFeaturedGoal(ctx.db, c, null);
    expect((await getQuestLog(ctx.db, c, 10)).savingsGoal).toBeNull();
  });

  it("starter rewards only fill an empty shop", async () => {
    await addSuggestedRewards(ctx.db, c);
    await expect(addSuggestedRewards(ctx.db, c)).rejects.toThrow(/empty/);
  });
});

describe("Completed log", () => {
  it("searches and filters by month", async () => {
    const [a, b] = await seed("Write script", "Record video");
    await completeQuest(ctx.db, c, a.id);
    await completeQuest(ctx.db, c, b.id);
    await ctx.db.update(quests).set({ completedAt: new Date("2026-09-15T12:00:00Z") }).where(eq(quests.id, a.id));
    expect((await getCompleted(ctx.db, c, { search: "record" })).items.map((q) => q.title)).toEqual(["Record video"]);
    expect((await getCompleted(ctx.db, c, { month: "2026-09" })).items.map((q) => q.title)).toEqual(["Write script"]);
    expect((await getCompleted(ctx.db, c, { search: "100%_" })).items).toHaveLength(0);
    expect((await getCompleted(ctx.db, c, {})).months[0] >= "2026-09").toBe(true);
  });
});
