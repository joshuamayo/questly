import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestCharacter } from "../testing/test-db";
import { completeQuest, createQuest, setObjectiveDone } from "../quests/service";
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
    const q = await createQuest(ctx.db, c, { title: "Ship it", skillKey: "business", difficulty: "NOVICE", objectives: ["Build", "Launch"] });
    const [o1] = (await exportCharacter(ctx.db, c)).quests[0].objectives;
    await setObjectiveDone(ctx.db, c, q.id, o1.id, true);
    await completeQuest(ctx.db, c, q.id).catch(() => null); // one objective still open: rejected, nothing awarded

    const data = JSON.parse(JSON.stringify(await exportCharacter(ctx.db, c)));
    expect(data.format).toBe(EXPORT_FORMAT);
    expect(data.character.displayName).toBe("Test Adventurer");
    expect(data.character).not.toHaveProperty("authSubject");
    expect(data.skills).toHaveLength(6);
    expect(data.quests[0]).toMatchObject({ title: "Ship it", status: "IN_PROGRESS" });
    expect(data.quests[0].objectives).toHaveLength(2);
    expect(data.progressionLedger.filter((t: { sourceType: string }) => t.sourceType === "QUEST")).toHaveLength(0);
    expect(data.activity.length).toBeGreaterThan(0);
  });
});
