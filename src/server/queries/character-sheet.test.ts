import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { xpForLevel } from "@/game/xp";
import { awardGp, awardQuestPoints, awardXp } from "../progression/service";
import { createTestCharacter } from "../testing/test-db";
import { getCharacterSheet, getRecentChronicle, resolveCurrentCharacterId } from "./character-sheet";

let ctx: Awaited<ReturnType<typeof createTestCharacter>>;
beforeEach(async () => {
  ctx = await createTestCharacter();
});
afterEach(async () => {
  await ctx.close();
});

describe("character sheet", () => {
  it("derives a fresh character: six Level 1 Skills, Total Level 6", async () => {
    const sheet = await getCharacterSheet(ctx.db, ctx.character.id);
    expect(sheet.skills.map((s) => s.name)).toEqual(["Creator", "Business", "Finance", "Fitness", "Home", "Focus"]);
    expect(sheet.skills.every((s) => s.progress.level === 1)).toBe(true);
    expect(sheet.totalLevel).toBe(6);
    expect(sheet.maxTotalLevel).toBe(594);
    expect(sheet.title?.name).toBe("Adventurer");
    expect(sheet.cape).toBeNull();
  });

  it("reflects persisted progression through the engine", async () => {
    await awardXp(ctx.db, ctx.character.id, "creator", xpForLevel(30), { sourceType: "SYSTEM" });
    await awardXp(ctx.db, ctx.character.id, "focus", xpForLevel(10) + 5, { sourceType: "SYSTEM" });
    await awardGp(ctx.db, ctx.character.id, 40, { sourceType: "QUEST" });
    await awardQuestPoints(ctx.db, ctx.character.id, 5, { sourceType: "QUEST" });

    const sheet = await getCharacterSheet(ctx.db, ctx.character.id);
    const creator = sheet.skills.find((s) => s.key === "creator")!;
    expect(creator.progress.level).toBe(30);
    expect(sheet.totalLevel).toBe(30 + 10 + 4);
    expect(sheet.totalXp).toBe(xpForLevel(30) + xpForLevel(10) + 5);
    expect(sheet.gp).toEqual({ balance: 40, lifetimeEarned: 40, lifetimeSpent: 0 });
    expect(sheet.questPoints).toBe(5);
  });

  it("resolves the current character and narrates real events only", async () => {
    expect(await resolveCurrentCharacterId(ctx.db)).toBe(ctx.character.id);
    await awardXp(ctx.db, ctx.character.id, "home", xpForLevel(3), { sourceType: "SYSTEM" });
    const chronicle = await getRecentChronicle(ctx.db, ctx.character.id);
    expect(chronicle.map((e) => e.text).sort()).toEqual(["Home reached Level 3.", "Your adventure began."]);
  });
});
