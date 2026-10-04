import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { xpForLevel } from "@/game/xp";
import { characters, progressionTransactions, questlines, quests } from "../db/schema";
import { designateBoss, clearBoss } from "../bosses/service";
import { awardXp } from "../progression/service";
import { buildRequirementContext, lockStates } from "../requirements/service";
import { completeQuest, createQuest } from "../quests/service";
import { createTestCharacter } from "../testing/test-db";
import { acceptQuestlineQuest, createQuestline } from "./service";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
beforeEach(async () => {
  ctx = await createTestCharacter();
});
afterEach(async () => {
  await ctx.close();
});

const today = "2026-10-04";
const NOW = new Date("2026-10-04T12:00:00Z");
const node = (key: string, parents: string[] = [], extra: Record<string, unknown> = {}) => ({
  key,
  title: key,
  skillKey: "business",
  difficulty: "INTERMEDIATE",
  parents,
  ...extra,
});

async function launchQuestline() {
  return createQuestline(ctx.db, ctx.character.id, {
    title: "MangoStax — The Launch",
    skillKey: "business",
    nodes: [node("Brand"), node("Store", ["Brand"]), node("Product", ["Store"]), node("Payment", ["Store"]), node("Launch", ["Product", "Payment"])],
  });
}
async function locks(ids: string[]) {
  const c = await buildRequirementContext(ctx.db, ctx.character.id, today);
  return lockStates(ctx.db, ctx.character.id, ids, c);
}
async function acceptAndComplete(id: string) {
  await acceptQuestlineQuest(ctx.db, ctx.character.id, id, { today });
  return completeQuest(ctx.db, ctx.character.id, id, { localDate: today, now: NOW });
}

describe("Questlines", () => {
  it("start with root Quests unlocked and the rest locked", async () => {
    const { questIds } = await launchQuestline();
    const state = await locks(questIds);
    expect(questIds.map((id) => state.get(id)!.locked)).toEqual([false, true, true, true, true]);
    expect(state.get(questIds[1])!.dependencies).toEqual([{ questId: questIds[0], title: "Brand", met: false }]);
  });

  it("refuse to accept a locked Quest", async () => {
    const { questIds } = await launchQuestline();
    await expect(acceptQuestlineQuest(ctx.db, ctx.character.id, questIds[1], { today })).rejects.toThrow(/locked.*Brand/);
  });

  it("unlock children as parents complete, reporting New Quest Available", async () => {
    const { questIds } = await launchQuestline();
    const [brand, store, product, payment] = questIds;
    const r1 = await acceptAndComplete(brand);
    expect(r1.unlocked.map((u) => u.id)).toEqual([store]);
    const r2 = await acceptAndComplete(store);
    expect(r2.unlocked.map((u) => u.id).sort()).toEqual([product, payment].sort());
    const r3 = await acceptAndComplete(product);
    expect(r3.unlocked).toEqual([]); // Launch still waits on Payment
  });

  it("award the completion bonus exactly once when every Quest is complete", async () => {
    const { questline, questIds } = await launchQuestline();
    let last;
    for (const id of questIds) last = await acceptAndComplete(id);
    expect(last!.questline).toMatchObject({ id: questline.id, bonusXp: Math.round(250 * 5 * 0.25), bonusGp: Math.round(5 * 5 * 0.25) });
    const [line] = await ctx.db.select().from(questlines).where(eq(questlines.id, questline.id));
    expect(line.status).toBe("COMPLETED");
    const bonusRows = await ctx.db.select().from(progressionTransactions).where(eq(progressionTransactions.sourceId, questline.id));
    expect(bonusRows.map((r) => r.kind).sort()).toEqual(["GP", "XP"]);
    // Re-completing the last Quest does not award the bonus again.
    const again = await completeQuest(ctx.db, ctx.character.id, questIds.at(-1)!, { localDate: today, now: NOW });
    expect(again.duplicate).toBe(true);
    expect(await ctx.db.select().from(progressionTransactions).where(eq(progressionTransactions.sourceId, questline.id))).toHaveLength(2);
  });

  it("gate Quests behind requirements as well as dependencies", async () => {
    const { questIds } = await createQuestline(ctx.db, ctx.character.id, {
      title: "Big League",
      skillKey: "business",
      nodes: [node("Pitch", [], { requirements: [{ type: "SKILL_LEVEL", reference: "business", requiredValue: 10 }] })],
    });
    expect((await locks(questIds)).get(questIds[0])!.locked).toBe(true);
    await awardXp(ctx.db, ctx.character.id, "business", xpForLevel(10), { sourceType: "SYSTEM" });
    expect((await locks(questIds)).get(questIds[0])!.locked).toBe(false);
  });

  it("snapshot rewards at acceptance, not at creation", async () => {
    const { questIds } = await launchQuestline();
    const accepted = await acceptQuestlineQuest(ctx.db, ctx.character.id, questIds[0], { today, targetDate: "2026-10-10" });
    expect(accepted).toMatchObject({ status: "ACCEPTED", rewardXp: 250, targetDate: "2026-10-10" });
    expect(accepted.acceptedAt).toBeInstanceOf(Date);
  });

  it("reject dependency loops", async () => {
    await expect(
      createQuestline(ctx.db, ctx.character.id, { title: "Loop", skillKey: "home", nodes: [node("A", ["B"]), node("B", ["A"])] }),
    ).rejects.toThrow(/loop/);
  });
});

describe("Bosses", () => {
  const bossDraft = { title: "The MangoStax Launch", skillKey: "business", difficulty: "MASTER", targetDate: "2026-10-10", deadline: "2026-10-15" };

  it("allow only one active Boss at a time", async () => {
    const a = await createQuest(ctx.db, ctx.character.id, bossDraft);
    const b = await createQuest(ctx.db, ctx.character.id, { ...bossDraft, title: "Other" });
    await designateBoss(ctx.db, ctx.character.id, a.id);
    await designateBoss(ctx.db, ctx.character.id, b.id);
    const bosses = await ctx.db.select().from(quests).where(eq(quests.isBoss, true));
    expect(bosses.map((q) => q.id)).toEqual([b.id]);
  });

  it("pay an early bounty as bonus GP on top of normal rewards", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, bossDraft);
    await designateBoss(ctx.db, ctx.character.id, q.id);
    const r = await completeQuest(ctx.db, ctx.character.id, q.id, { localDate: "2026-10-04", now: NOW });
    expect(r.boss).toEqual({ tier: "EARLY", bountyGp: 30 });
    const [c] = await ctx.db.select().from(characters).where(eq(characters.id, ctx.character.id));
    expect(c.gpBalance).toBe(40 + 30);
  });

  it("let a late bounty expire without touching normal rewards", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, { ...bossDraft, targetDate: "2026-09-01", deadline: "2026-09-10" });
    await designateBoss(ctx.db, ctx.character.id, q.id);
    const r = await completeQuest(ctx.db, ctx.character.id, q.id, { localDate: "2026-10-04", now: NOW });
    expect(r.boss).toEqual({ tier: "LATE", bountyGp: 0 });
    expect(r.rewards).toEqual({ xp: 2000, gp: 40, qp: 5 });
  });

  it("can be stood down, removing the bounty", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, bossDraft);
    await designateBoss(ctx.db, ctx.character.id, q.id);
    await clearBoss(ctx.db, ctx.character.id, q.id);
    const r = await completeQuest(ctx.db, ctx.character.id, q.id, { localDate: "2026-10-04", now: NOW });
    expect(r.boss).toBeNull();
  });
});

describe("trusted local dates", () => {
  it("accept the client's date within a day of the server and fall back otherwise", async () => {
    const { trustedLocalDate } = await import("../requirements/service");
    expect(trustedLocalDate("2026-10-05", NOW)).toBe("2026-10-05");
    expect(trustedLocalDate("2026-10-03", NOW)).toBe("2026-10-03");
    expect(trustedLocalDate("2026-12-25", NOW)).toBe("2026-10-04");
    expect(trustedLocalDate("garbage", NOW)).toBe("2026-10-04");
  });
});
