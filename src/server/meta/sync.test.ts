import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { xpForLevel } from "@/game/xp";
import { characterCollectionItems, characterTitles, characters, progressionTransactions } from "../db/schema";
import { claimCollectionItem, equipCape, equipTitle, setCollectionNote } from "../collection/service";
import { addCustomEntry, claimDiaryTier, getDiary, setCustomEntryDone } from "../diaries/service";
import { awardXp } from "../progression/service";
import { completeQuest, createQuest } from "../quests/service";
import { createTestCharacter } from "../testing/test-db";
import { computeMetrics } from "./metrics";
import { syncProgression } from "./sync";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
beforeEach(async () => {
  ctx = await createTestCharacter();
});
afterEach(async () => {
  await ctx.close();
});

const NOW = new Date("2026-10-07T12:00:00Z");
const today = "2026-10-07";
async function quest(over: Record<string, unknown> = {}) {
  const q = await createQuest(ctx.db, ctx.character.id, { title: "Q", skillKey: "creator", difficulty: "NOVICE", ...over });
  return completeQuest(ctx.db, ctx.character.id, q.id, { localDate: today, now: NOW });
}
async function character() {
  const [c] = await ctx.db.select().from(characters).where(eq(characters.id, ctx.character.id));
  return c;
}

describe("Combat Achievements", () => {
  it("complete automatically from explicit rules and award Combat Points once", async () => {
    const r = await quest({ targetDate: "2026-10-10" });
    expect(r.meta.achievements.map((a) => a.key)).toEqual(expect.arrayContaining(["first-blood", "ahead-of-schedule"]));
    const cp = (await character()).combatPoints;
    expect(cp).toBe(r.meta.achievements.reduce((s, a) => s + a.combatPoints, 0));
    // Re-syncing awards nothing new.
    const again = await syncProgression(ctx.db, ctx.character.id);
    expect(again.achievements).toEqual([]);
    expect((await character()).combatPoints).toBe(cp);
    const rows = await ctx.db.select().from(progressionTransactions).where(eq(progressionTransactions.sourceId, "first-blood"));
    expect(rows).toHaveLength(1);
  });

  it("track on-time deadline completion using the player's local date", async () => {
    await quest({ deadline: "2026-10-07" });
    expect((await computeMetrics(ctx.db, ctx.character.id)).deadlineQuestsOnTime).toBe(1);
    await quest({ deadline: "2026-10-06" });
    expect((await computeMetrics(ctx.db, ctx.character.id)).deadlineQuestsOnTime).toBe(1);
  });

  it("update progress as metrics change", async () => {
    await awardXp(ctx.db, ctx.character.id, "home", xpForLevel(10), { sourceType: "SYSTEM" });
    const r = await syncProgression(ctx.db, ctx.character.id);
    expect(r.achievements.map((a) => a.key)).toContain("apprentice");
  });
});

describe("Collection Log", () => {
  it("unlocks auto items once and never duplicates", async () => {
    const r = await quest();
    expect(r.meta.collection.map((c) => c.key)).toEqual(expect.arrayContaining(["first-quest", "creator-first-quest"]));
    await syncProgression(ctx.db, ctx.character.id);
    const owned = await ctx.db
      .select()
      .from(characterCollectionItems)
      .where(and(eq(characterCollectionItems.characterId, ctx.character.id), eq(characterCollectionItems.itemKey, "first-quest")));
    expect(owned).toHaveLength(1);
  });

  it("lets manual items be claimed once, with a memory", async () => {
    await claimCollectionItem(ctx.db, ctx.character.id, "100k-video", "The thumbnail test paid off.");
    await expect(claimCollectionItem(ctx.db, ctx.character.id, "100k-video")).rejects.toThrow(/already obtained/);
    await setCollectionNote(ctx.db, ctx.character.id, "100k-video", "Edited memory");
    await expect(claimCollectionItem(ctx.db, ctx.character.id, "first-quest")).rejects.toThrow(/automatically/);
  });

  it("does not reveal or allow notes on items not yet obtained", async () => {
    await expect(setCollectionNote(ctx.db, ctx.character.id, "1m-video", "x")).rejects.toThrow(/Obtain/);
  });
});

describe("Titles and capes", () => {
  it("unlock Titles from rules and only equip earned ones", async () => {
    await expect(equipTitle(ctx.db, ctx.character.id, "merchant")).rejects.toThrow(/not earned/);
    await awardXp(ctx.db, ctx.character.id, "business", xpForLevel(50), { sourceType: "SYSTEM" });
    const r = await syncProgression(ctx.db, ctx.character.id);
    expect(r.titles.map((t) => t.key)).toContain("merchant");
    await equipTitle(ctx.db, ctx.character.id, "merchant");
    expect((await character()).equippedTitleKey).toBe("merchant");
    const owned = await ctx.db.select().from(characterTitles).where(eq(characterTitles.characterId, ctx.character.id));
    expect(owned.map((o) => o.titleKey).sort()).toEqual(["adventurer", "merchant"]);
  });

  it("only equip Skill Capes at Level 99", async () => {
    await expect(equipCape(ctx.db, ctx.character.id, "cape-home")).rejects.toThrow(/Level 99/);
    await awardXp(ctx.db, ctx.character.id, "home", xpForLevel(99), { sourceType: "SYSTEM" });
    await equipCape(ctx.db, ctx.character.id, "cape-home");
    expect((await character()).equippedCapeKey).toBe("cape-home");
  });
});

describe("Achievement Diaries", () => {
  it("track entries within the period and claim tiers once, in order", async () => {
    await quest();
    const diary = await getDiary(ctx.db, ctx.character.id, "WEEKLY", today);
    expect(diary.period.start).toBe("2026-10-05");
    const easy = diary.tiers.find((t) => t.tier === "EASY")!;
    expect(easy).toMatchObject({ done: 1, total: 2, complete: false });

    // Add and complete a manual entry in Medium, then check order rules.
    const entry = await addCustomEntry(ctx.db, ctx.character.id, "WEEKLY", "EASY", "Finish landscaping project", today);
    await setCustomEntryDone(ctx.db, ctx.character.id, entry.id, true);
    await expect(claimDiaryTier(ctx.db, ctx.character.id, "WEEKLY", "EASY", today)).rejects.toThrow(/every entry/);
  });

  it("award the tier reward exactly once", async () => {
    const { startFocusSession, completeFocusSession } = await import("../focus/service");
    await quest();
    const s = await startFocusSession(ctx.db, ctx.character.id, { minutes: 30 }, new Date());
    await completeFocusSession(ctx.db, ctx.character.id, s.id, new Date(Date.now() + 31 * 60_000));
    const localToday = new Date().toISOString().slice(0, 10);
    // The test quest above was dated 2026-10-07; complete one dated today for the current week.
    const q = await createQuest(ctx.db, ctx.character.id, { title: "Now", skillKey: "home", difficulty: "NOVICE" });
    await completeQuest(ctx.db, ctx.character.id, q.id, { localDate: localToday });
    const before = (await character()).gpBalance;
    const r = await claimDiaryTier(ctx.db, ctx.character.id, "WEEKLY", "EASY", localToday);
    expect(r.reward).toEqual({ gp: 10, focusXp: 50 });
    expect((await character()).gpBalance).toBe(before + 10);
    await expect(claimDiaryTier(ctx.db, ctx.character.id, "WEEKLY", "EASY", localToday)).rejects.toThrow(/already been claimed/);
    const diary = await getDiary(ctx.db, ctx.character.id, "WEEKLY", localToday);
    expect(diary.tiers[0]).toMatchObject({ claimed: true, claimable: false });
    await expect(addCustomEntry(ctx.db, ctx.character.id, "WEEKLY", "EASY", "late", localToday)).rejects.toThrow(/already been claimed/);
  });
});
