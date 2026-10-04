import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QUEST_REWARDS } from "@/game/config/balance";
import { xpForLevel } from "@/game/xp";
import { activityEvents, characters, progressionTransactions, quests } from "../db/schema";
import { getCharacterSheet } from "../queries/character-sheet";
import { awardXp } from "../progression/service";
import { createTestCharacter } from "../testing/test-db";
import {
  abandonQuest,
  acceptTemplate,
  addObjective,
  completeQuest,
  createQuest,
  holdQuest,
  moveObjective,
  removeObjective,
  restoreQuest,
  resumeQuest,
  setObjectiveDone,
  setQuestPriority,
  updateQuestDetails,
} from "./service";
import { getQuestDetail } from "../queries/quests";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
beforeEach(async () => {
  ctx = await createTestCharacter();
});
afterEach(async () => {
  await ctx.close();
});

const draft = (over: Record<string, unknown> = {}) => ({
  title: "Publish AI Side Hustles Video",
  skillKey: "creator",
  difficulty: "EXPERIENCED",
  objectives: ["Write the script", "Record the video", "Publish the video"],
  ...over,
});

async function ledger() {
  return ctx.db.select().from(progressionTransactions).where(eq(progressionTransactions.characterId, ctx.character.id));
}
async function character() {
  const [c] = await ctx.db.select().from(characters).where(eq(characters.id, ctx.character.id));
  return c;
}
async function finishAll(questId: string) {
  const detail = await getQuestDetail(ctx.db, ctx.character.id, questId);
  for (const o of detail.objectives) await setObjectiveDone(ctx.db, ctx.character.id, questId, o.id, true);
}

describe("accepting Quests", () => {
  it("creates an accepted Quest with rewards derived from difficulty", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft());
    expect(q).toMatchObject({ status: "ACCEPTED", rewardXp: 750, rewardGp: 15, rewardQp: 3, priority: "SIDE" });
    expect(q.acceptedAt).toBeInstanceOf(Date);
  });

  it("snapshots rewards at acceptance; later balance changes do not apply", async () => {
    const generous = { ...QUEST_REWARDS, EXPERIENCED: { xp: 9_999, gp: 99, qp: 9 } };
    const q = await createQuest(ctx.db, ctx.character.id, draft(), generous);
    // Completed under the default balance, the snapshot still governs.
    await finishAll(q.id);
    const result = await completeQuest(ctx.db, ctx.character.id, q.id);
    expect(result.rewards).toEqual({ xp: 9_999, gp: 99, qp: 9 });
    expect((await character()).gpBalance).toBe(99);
  });

  it("accepts a template as a new, independent Quest every time", async () => {
    const a = await acceptTemplate(ctx.db, ctx.character.id, "deep-work-sprint");
    const b = await acceptTemplate(ctx.db, ctx.character.id, "deep-work-sprint");
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({ templateKey: "deep-work-sprint", skillKey: "focus", difficulty: "NOVICE", rewardXp: 100 });
    const detail = await getQuestDetail(ctx.db, ctx.character.id, a.id);
    expect(detail.objectives.map((o) => o.title)).toEqual([
      "Choose the one thing",
      "Remove distractions",
      "Complete the deep work session",
    ]);
  });

  it("refuses to accept the Custom Quest template directly", async () => {
    await expect(acceptTemplate(ctx.db, ctx.character.id, "custom-quest")).rejects.toThrow(/Create Quest/);
  });

  it("caps active Main Quests at three", async () => {
    for (let i = 0; i < 3; i++) await createQuest(ctx.db, ctx.character.id, draft({ priority: "MAIN" }));
    await expect(createQuest(ctx.db, ctx.character.id, draft({ priority: "MAIN" }))).rejects.toThrow(/3 Main Quests/);
    const side = await createQuest(ctx.db, ctx.character.id, draft());
    await expect(setQuestPriority(ctx.db, ctx.character.id, side.id, "MAIN")).rejects.toThrow(/3 Main Quests/);
  });
});

describe("objectives", () => {
  it("advance progress without awarding any XP", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft());
    const detail = await getQuestDetail(ctx.db, ctx.character.id, q.id);
    const progress = await setObjectiveDone(ctx.db, ctx.character.id, q.id, detail.objectives[0].id, true);
    expect(progress).toMatchObject({ done: 1, total: 3, currentObjectiveId: detail.objectives[1].id });
    expect(await ledger()).toHaveLength(0);
    const [row] = await ctx.db.select().from(quests).where(eq(quests.id, q.id));
    expect(row.status).toBe("IN_PROGRESS");
  });

  it("splitting a Quest into many objectives never multiplies rewards", async () => {
    const many = Array.from({ length: 30 }, (_, i) => `Step ${i + 1}`);
    const q = await createQuest(ctx.db, ctx.character.id, draft({ objectives: many, difficulty: "NOVICE" }));
    await finishAll(q.id);
    await completeQuest(ctx.db, ctx.character.id, q.id);
    const xp = (await ledger()).filter((t) => t.kind === "XP").reduce((s, t) => s + t.amount, 0);
    expect(xp).toBe(100);
  });

  it("can be added, removed, and reordered while the Quest is active", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft());
    const added = await addObjective(ctx.db, ctx.character.id, q.id, "Create the thumbnail");
    let detail = await getQuestDetail(ctx.db, ctx.character.id, q.id);
    expect(detail.objectives.at(-1)?.title).toBe("Create the thumbnail");
    await moveObjective(ctx.db, ctx.character.id, q.id, added.id, "up");
    detail = await getQuestDetail(ctx.db, ctx.character.id, q.id);
    expect(detail.objectives.map((o) => o.title).slice(-2)).toEqual(["Create the thumbnail", "Publish the video"]);
    await removeObjective(ctx.db, ctx.character.id, q.id, added.id);
    detail = await getQuestDetail(ctx.db, ctx.character.id, q.id);
    expect(detail.objectives).toHaveLength(3);
  });
});

describe("completing Quests", () => {
  it("requires every objective to be complete", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft());
    await expect(completeQuest(ctx.db, ctx.character.id, q.id)).rejects.toThrow(/remaining 3 objectives/);
  });

  it("awards XP, GP, and QP exactly once", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft());
    await finishAll(q.id);
    const first = await completeQuest(ctx.db, ctx.character.id, q.id);
    const second = await completeQuest(ctx.db, ctx.character.id, q.id);
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    const rows = await ledger();
    expect(rows.map((r) => [r.kind, r.amount]).sort()).toEqual([
      ["GP", 15],
      ["QP", 3],
      ["XP", 750],
    ]);
    expect(rows.every((r) => r.sourceType === "QUEST" && r.sourceId === q.id)).toBe(true);
    expect(await character()).toMatchObject({ gpBalance: 15, questPoints: 3 });
  });

  it("reports a Level Up, including multiple levels from one reward", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft({ difficulty: "GRANDMASTER", objectives: [] }));
    const result = await completeQuest(ctx.db, ctx.character.id, q.id);
    expect(result.levelUp).toMatchObject({ skillKey: "creator", fromLevel: 1 });
    expect(result.levelUp!.levelsReached.length).toBeGreaterThan(1);
    expect(result.totals.totalLevelAfter).toBeGreaterThan(result.totals.totalLevelBefore);
  });

  it("reports no Level Up when the level does not change", async () => {
    await awardXp(ctx.db, ctx.character.id, "creator", xpForLevel(50), { sourceType: "SYSTEM" });
    const q = await createQuest(ctx.db, ctx.character.id, draft({ difficulty: "NOVICE", objectives: [] }));
    const result = await completeQuest(ctx.db, ctx.character.id, q.id);
    expect(result.levelUp).toBeNull();
  });

  it("gives abandoned Quests no reward and preserves their history", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft());
    const detail = await getQuestDetail(ctx.db, ctx.character.id, q.id);
    await setObjectiveDone(ctx.db, ctx.character.id, q.id, detail.objectives[0].id, true);
    await abandonQuest(ctx.db, ctx.character.id, q.id);
    await expect(completeQuest(ctx.db, ctx.character.id, q.id)).rejects.toThrow(/abandoned/);
    expect(await ledger()).toHaveLength(0);
    const after = await getQuestDetail(ctx.db, ctx.character.id, q.id);
    expect(after.status).toBe("ABANDONED");
    expect(after.objectives.filter((o) => o.done)).toHaveLength(1);
  });

  it("restores an abandoned Quest to its in-progress state", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft());
    const detail = await getQuestDetail(ctx.db, ctx.character.id, q.id);
    await setObjectiveDone(ctx.db, ctx.character.id, q.id, detail.objectives[0].id, true);
    await abandonQuest(ctx.db, ctx.character.id, q.id);
    await restoreQuest(ctx.db, ctx.character.id, q.id);
    expect((await getQuestDetail(ctx.db, ctx.character.id, q.id)).status).toBe("IN_PROGRESS");
  });

  it("blocks objective changes and completion while on hold", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft({ objectives: [] }));
    await holdQuest(ctx.db, ctx.character.id, q.id);
    await expect(completeQuest(ctx.db, ctx.character.id, q.id)).rejects.toThrow(/on hold/);
    await resumeQuest(ctx.db, ctx.character.id, q.id);
    await expect(completeQuest(ctx.db, ctx.character.id, q.id)).resolves.toMatchObject({ duplicate: false });
  });

  it("never lets another character touch the Quest", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft({ objectives: [] }));
    await expect(completeQuest(ctx.db, "00000000-0000-0000-0000-000000000000", q.id)).rejects.toThrow(/could not be found/);
  });

  it("keeps notes editable on a completed Quest but locks its story and dates", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft({ objectives: [] }));
    await completeQuest(ctx.db, ctx.character.id, q.id);
    await expect(updateQuestDetails(ctx.db, ctx.character.id, q.id, { notes: "Hit 10k views!" })).resolves.toMatchObject({
      notes: "Hit 10k views!",
    });
    await expect(updateQuestDetails(ctx.db, ctx.character.id, q.id, { title: "Renamed" })).rejects.toThrow(/already complete/);
  });
});

describe("the core Quest loop", () => {
  it("create → accept → objectives → complete → rewards once → progression persists", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, draft({ priority: "MAIN", targetDate: "2026-10-12" }));
    await finishAll(q.id);
    const result = await completeQuest(ctx.db, ctx.character.id, q.id);
    expect(result.rewards).toEqual({ xp: 750, gp: 15, qp: 3 });

    // A fresh read (as after a reload) reflects the new account state.
    const sheet = await getCharacterSheet(ctx.db, ctx.character.id);
    expect(sheet.skills.find((s) => s.key === "creator")!.progress.totalXp).toBe(750);
    expect(sheet.gp.balance).toBe(15);
    expect(sheet.questPoints).toBe(3);
    expect(sheet.totalLevel).toBe(result.totals.totalLevelAfter);

    const events = await ctx.db
      .select({ type: activityEvents.type })
      .from(activityEvents)
      .where(and(eq(activityEvents.characterId, ctx.character.id), eq(activityEvents.entityId, q.id)));
    expect(events.map((e) => e.type)).toEqual(
      expect.arrayContaining(["QUEST_ACCEPTED", "QUEST_OBJECTIVE_COMPLETED", "QUEST_COMPLETED"]),
    );
  });
});
