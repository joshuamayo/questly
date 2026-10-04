import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { characterSkills, progressionTransactions } from "../db/schema";
import { createQuest } from "../quests/service";
import { createTestCharacter } from "../testing/test-db";
import { cancelFocusSession, completeFocusSession, getActiveSession, startFocusSession } from "./service";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
beforeEach(async () => {
  ctx = await createTestCharacter();
});
afterEach(async () => {
  await ctx.close();
});

const at = (iso: string) => new Date(iso);
async function focusXp() {
  const [row] = await ctx.db
    .select()
    .from(characterSkills)
    .where(and(eq(characterSkills.characterId, ctx.character.id), eq(characterSkills.skillKey, "focus")));
  return row.xp;
}

describe("Focus sessions", () => {
  it("award Focus XP for the minutes actually focused", async () => {
    const s = await startFocusSession(ctx.db, ctx.character.id, { minutes: 60 }, at("2026-10-04T10:00:00Z"));
    const r = await completeFocusSession(ctx.db, ctx.character.id, s.id, at("2026-10-04T11:05:00Z"));
    expect(r.minutes).toBe(60);
    expect(r.focusXp.xp).toBe(60);
    expect(await focusXp()).toBe(60);
    const [tx] = await ctx.db.select().from(progressionTransactions).where(eq(progressionTransactions.sourceId, s.id));
    expect(tx).toMatchObject({ kind: "XP", skillKey: "focus", sourceType: "FOCUS_SESSION" });
  });

  it("award nothing for sessions shorter than the lowest tier", async () => {
    const s = await startFocusSession(ctx.db, ctx.character.id, { minutes: 25 }, at("2026-10-04T10:00:00Z"));
    const r = await completeFocusSession(ctx.db, ctx.character.id, s.id, at("2026-10-04T10:25:00Z"));
    expect(r.focusXp.xp).toBe(0);
    expect(await focusXp()).toBe(0);
  });

  it("allow only one running session and never pay twice", async () => {
    const s = await startFocusSession(ctx.db, ctx.character.id, { minutes: 30 }, at("2026-10-04T10:00:00Z"));
    await expect(startFocusSession(ctx.db, ctx.character.id, { minutes: 30 })).rejects.toThrow(/already running/);
    await completeFocusSession(ctx.db, ctx.character.id, s.id, at("2026-10-04T10:30:00Z"));
    await expect(completeFocusSession(ctx.db, ctx.character.id, s.id, at("2026-10-04T10:31:00Z"))).rejects.toThrow(/already ended/);
    expect(await focusXp()).toBe(25);
  });

  it("apply diminishing returns and the rolling daily cap", async () => {
    let t = Date.parse("2026-10-04T06:00:00Z");
    const awards: number[] = [];
    for (let i = 0; i < 6; i++) {
      const s = await startFocusSession(ctx.db, ctx.character.id, { minutes: 90 }, new Date(t));
      t += 90 * 60_000;
      awards.push((await completeFocusSession(ctx.db, ctx.character.id, s.id, new Date(t))).focusXp.xp);
      t += 10 * 60_000;
    }
    expect(awards).toEqual([100, 100, 100, 0, 0, 0]);
    expect(await focusXp()).toBe(300);
  });

  it("cancel without XP and keep the record", async () => {
    const s = await startFocusSession(ctx.db, ctx.character.id, { minutes: 50 });
    await cancelFocusSession(ctx.db, ctx.character.id, s.id);
    expect(await getActiveSession(ctx.db, ctx.character.id)).toBeNull();
    expect(await focusXp()).toBe(0);
  });

  it("only target active Quests", async () => {
    const q = await createQuest(ctx.db, ctx.character.id, { title: "Q", skillKey: "creator", difficulty: "NOVICE" });
    await expect(startFocusSession(ctx.db, ctx.character.id, { minutes: 25, questId: q.id })).resolves.toMatchObject({ questId: q.id });
  });
});
