import { describe, expect, it } from "vitest";
import { SKILL_DEFINITIONS } from "@/game/content/skills";
import { SPRITE_PALETTE, SPRITES } from "./sprites";

describe("pixel sprites", () => {
  it.each(Object.entries(SPRITES))("%s is a valid 16×16 grid using palette colors", (_name, rows) => {
    expect(rows).toHaveLength(16);
    for (const row of rows) {
      expect(row).toHaveLength(16);
      for (const ch of row) if (ch !== ".") expect(SPRITE_PALETTE[ch], `unknown color "${ch}"`).toBeDefined();
    }
  });

  it("has an icon for every canonical Skill", () => {
    for (const skill of SKILL_DEFINITIONS) expect(SPRITES).toHaveProperty(skill.icon);
  });
});
