import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InsufficientGpError, InvalidProgressionError } from "@/game/errors";
import { xpForLevel } from "@/game/xp";
import { activityEvents, characterSkills, characters, progressionTransactions } from "../db/schema";
import { createTestCharacter } from "../testing/test-db";
import {
  awardCombatPoints,
  awardGp,
  awardQuestPoints,
  awardXp,
  reconcileCharacter,
  recordProgression,
  spendGp,
} from "./service";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
beforeEach(async () => {
  ctx = await createTestCharacter();
});
afterEach(async () => {
  await ctx.close();
});

const quest = (id: string) => ({ sourceType: "QUEST" as const, sourceId: id });
const redemption = (id: string) => ({ sourceType: "REWARD_REDEMPTION" as const, sourceId: id });

async function character() {
  const [row] = await ctx.db.select().from(characters).where(eq(characters.id, ctx.character.id));
  return row;
}
async function ledger() {
  return ctx.db
    .select()
    .from(progressionTransactions)
    .where(eq(progressionTransactions.characterId, ctx.character.id))
    .orderBy(progressionTransactions.seq);
}
async function skillXp(skillKey: string) {
  const [row] = await ctx.db
    .select()
    .from(characterSkills)
    .where(and(eq(characterSkills.characterId, ctx.character.id), eq(characterSkills.skillKey, skillKey)));
  return row.xp;
}

describe("new character", () => {
  it("starts with all six Skills at 0 XP and empty balances", async () => {
    const rows = await ctx.db.select().from(characterSkills).where(eq(characterSkills.characterId, ctx.character.id));
    expect(rows.map((r) => r.skillKey).sort()).toEqual(["business", "creator", "finance", "fitness", "focus", "home"]);
    expect(rows.every((r) => r.xp === 0)).toBe(true);
    expect(await character()).toMatchObject({
      gpBalance: 0,
      lifetimeGpEarned: 0,
      lifetimeGpSpent: 0,
      questPoints: 0,
      combatPoints: 0,
      equippedTitleKey: "adventurer",
    });
  });
});

describe("GP", () => {
  it("earns GP and records lifetime earnings", async () => {
    await awardGp(ctx.db, ctx.character.id, 15, quest("q-1"));
    expect(await character()).toMatchObject({ gpBalance: 15, lifetimeGpEarned: 15, lifetimeGpSpent: 0 });
  });

  it("spends GP and records lifetime spending", async () => {
    await awardGp(ctx.db, ctx.character.id, 40, quest("q-1"));
    await spendGp(ctx.db, ctx.character.id, 25, redemption("r-1"));
    expect(await character()).toMatchObject({ gpBalance: 15, lifetimeGpEarned: 40, lifetimeGpSpent: 25 });
    const rows = await ledger();
    expect(rows.map((r) => r.amount)).toEqual([40, -25]);
  });

  it("refuses to spend more GP than the balance and changes nothing", async () => {
    await awardGp(ctx.db, ctx.character.id, 10, quest("q-1"));
    await expect(spendGp(ctx.db, ctx.character.id, 11, redemption("r-1"))).rejects.toBeInstanceOf(InsufficientGpError);
    expect(await character()).toMatchObject({ gpBalance: 10, lifetimeGpSpent: 0 });
    expect(await ledger()).toHaveLength(1);
  });

  it("can spend exactly to zero but never below", async () => {
    await awardGp(ctx.db, ctx.character.id, 5, quest("q-1"));
    await spendGp(ctx.db, ctx.character.id, 5, redemption("r-1"));
    expect((await character()).gpBalance).toBe(0);
    await expect(spendGp(ctx.db, ctx.character.id, 1, redemption("r-2"))).rejects.toBeInstanceOf(InsufficientGpError);
    expect((await character()).gpBalance).toBe(0);
  });

  it("is protected by the database even if service checks are bypassed", async () => {
    await expect(
      ctx.db.update(characters).set({ gpBalance: -1, lifetimeGpSpent: 1 }).where(eq(characters.id, ctx.character.id)),
    ).rejects.toThrow();
  });

  it("cannot be deducted by non-redemption sources", async () => {
    await awardGp(ctx.db, ctx.character.id, 10, quest("q-1"));
    await expect(
      recordProgression(ctx.db, ctx.character.id, { kind: "GP", amount: -5, sourceType: "QUEST", sourceId: "q-1" }),
    ).rejects.toBeInstanceOf(InvalidProgressionError);
  });

  it("serializes concurrent spends so the balance never goes negative", async () => {
    await awardGp(ctx.db, ctx.character.id, 10, quest("q-1"));
    const results = await Promise.allSettled([
      spendGp(ctx.db, ctx.character.id, 7, redemption("r-1")),
      spendGp(ctx.db, ctx.character.id, 7, redemption("r-2")),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await character()).gpBalance).toBe(3);
  });
});

describe("XP", () => {
  it("awards XP to a Skill and records the transaction", async () => {
    const result = await awardXp(ctx.db, ctx.character.id, "creator", 100, quest("q-1"));
    expect(await skillXp("creator")).toBe(100);
    expect(await skillXp("focus")).toBe(0);
    expect(result.xp).toMatchObject({ previousLevel: 1, leveledUp: true });
    expect(result.transaction).toMatchObject({ kind: "XP", amount: 100, skillKey: "creator" });
  });

  it("reports multiple level-ups and writes a LEVEL_UP activity event", async () => {
    const result = await awardXp(ctx.db, ctx.character.id, "fitness", xpForLevel(20), quest("q-1"));
    expect(result.xp).toMatchObject({ previousLevel: 1, newLevel: 20, levelsGained: 19 });
    const events = await ctx.db
      .select()
      .from(activityEvents)
      .where(and(eq(activityEvents.characterId, ctx.character.id), eq(activityEvents.type, "LEVEL_UP")));
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({ skillKey: "fitness", fromLevel: 1, toLevel: 20 });
  });

  it("does not write a LEVEL_UP event when no level is gained", async () => {
    await awardXp(ctx.db, ctx.character.id, "home", 1, quest("q-1"));
    const events = await ctx.db.select().from(activityEvents).where(eq(activityEvents.type, "LEVEL_UP"));
    expect(events).toHaveLength(0);
  });
});

describe("Quest Points and Combat Points", () => {
  it("awards Quest Points", async () => {
    await awardQuestPoints(ctx.db, ctx.character.id, 3, quest("q-1"));
    await awardQuestPoints(ctx.db, ctx.character.id, 10, quest("q-2"));
    expect((await character()).questPoints).toBe(13);
  });

  it("awards Combat Points", async () => {
    await awardCombatPoints(ctx.db, ctx.character.id, 5, { sourceType: "COMBAT_ACHIEVEMENT", sourceId: "ca-1" });
    expect((await character()).combatPoints).toBe(5);
  });

  it("never deducts permanent progression", async () => {
    await expect(awardQuestPoints(ctx.db, ctx.character.id, -1, quest("q-1"))).rejects.toBeInstanceOf(
      InvalidProgressionError,
    );
  });
});

describe("transactions", () => {
  it("record kind, amount, source type, source id, timestamp, and metadata", async () => {
    const before = Date.now();
    await awardXp(ctx.db, ctx.character.id, "finance", 250, {
      sourceType: "QUEST",
      sourceId: "quest-42",
      metadata: { difficulty: "INTERMEDIATE", questTitle: "Monthly Financial Review" },
    });
    const [row] = await ledger();
    expect(row).toMatchObject({
      characterId: ctx.character.id,
      kind: "XP",
      amount: 250,
      skillKey: "finance",
      sourceType: "QUEST",
      sourceId: "quest-42",
      metadata: { difficulty: "INTERMEDIATE", questTitle: "Monthly Financial Review" },
    });
    expect(row.createdAt).toBeInstanceOf(Date);
    expect(row.createdAt.getTime()).toBeGreaterThanOrEqual(before - 5_000);
  });

  it("prevent duplicate rewards with an idempotency key", async () => {
    const source = { ...quest("q-1"), idempotencyKey: "quest:q-1:completion:gp" };
    const first = await awardGp(ctx.db, ctx.character.id, 15, source);
    const second = await awardGp(ctx.db, ctx.character.id, 15, source);
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.transaction?.id).toBe(first.transaction?.id);
    expect((await character()).gpBalance).toBe(15);
    expect(await ledger()).toHaveLength(1);
  });

  it("roll back completely when a change fails", async () => {
    await expect(spendGp(ctx.db, ctx.character.id, 5, redemption("r-1"))).rejects.toThrow();
    expect(await ledger()).toHaveLength(0);
  });

  it("keep cached balances reconcilable with the ledger", async () => {
    await awardXp(ctx.db, ctx.character.id, "creator", 750, quest("q-1"));
    await awardGp(ctx.db, ctx.character.id, 15, quest("q-1"));
    await awardQuestPoints(ctx.db, ctx.character.id, 3, quest("q-1"));
    await spendGp(ctx.db, ctx.character.id, 10, redemption("r-1"));
    await awardCombatPoints(ctx.db, ctx.character.id, 2, { sourceType: "COMBAT_ACHIEVEMENT" });
    const report = await reconcileCharacter(ctx.db, ctx.character.id);
    expect(report.consistent).toBe(true);
    expect(report.fromLedger).toMatchObject({ gpBalance: 5, questPoints: 3, combatPoints: 2 });
    expect(report.fromLedger.skillXp.creator).toBe(750);
  });
});
