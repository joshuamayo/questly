import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestCharacter } from "../testing/test-db";
import { completeQuest, createQuest } from "../quests/service";
import { exportCharacter, EXPORT_FORMAT } from "./service";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
beforeEach(async () => {
  ctx = await createTestCharacter();
});
afterEach(async () => {
  await ctx.close();
});

describe("Account export", () => {
  it("includes the character's history and is JSON-serializable", async () => {
    const c = ctx.character.id;
    const q1 = await createQuest(ctx.db, c, { title: "Ship it" });
    await createQuest(ctx.db, c, { title: "Next thing" });
    await completeQuest(ctx.db, c, q1.id);
    const data = JSON.parse(JSON.stringify(await exportCharacter(ctx.db, c)));
    expect(data.format).toBe(EXPORT_FORMAT);
    expect(data.character.displayName).toBe("Test Adventurer");
    expect(data.character).not.toHaveProperty("authSubject");
    expect(data.questLog.map((q: { title: string }) => q.title)).toEqual(["Next thing"]);
    expect(data.completed.map((q: { title: string }) => q.title)).toEqual(["Ship it"]);
    expect(data.gpTransactions).toHaveLength(1);
  });
});
