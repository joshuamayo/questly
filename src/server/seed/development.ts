/**
 * Development seed data.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ This is the ONLY place demo progression is defined.                  │
 * │ `npm run db:seed` creates a fresh character (all Skills Level 1,     │
 * │ 0 GP / QP / Combat Points). Demo progression is opt-in via           │
 * │ `npm run db:seed:demo` and is written through the real ledger with   │
 * │ sourceType "SEED_DEMO", so it is traceable and never invisible.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { asc } from "drizzle-orm";
import type { AvatarConfig } from "@/game/avatar";
import type { SkillKey } from "@/game/vocabulary";
import type { Db } from "../db/client";
import { characters } from "../db/schema";
import { createCharacter } from "../characters/service";
import { recordProgression } from "../progression/service";

export const DEV_CHARACTER = {
  displayName: "Joshua",
  avatar: {
    version: 1,
    skinTone: "sand",
    hairStyle: "short",
    hairColor: "chestnut",
    tunicColor: "moss",
    beard: true,
  } satisfies AvatarConfig,
};

/** Creates the development character if no character exists yet. */
export async function seedDevelopmentCharacter(db: Db) {
  const [existing] = await db.select().from(characters).orderBy(asc(characters.createdAt)).limit(1);
  if (existing) return { character: existing, created: false };
  const character = await createCharacter(db, DEV_CHARACTER);
  return { character, created: true };
}

/**
 * DEMO PROGRESSION — opt-in only. Lets the Skills/World screens show
 * mid-progress bars and level variety for visual validation.
 */
export const DEMO_PROGRESSION: ReadonlyArray<
  | { kind: "XP"; skillKey: SkillKey; amount: number; note: string }
  | { kind: "GP" | "QP" | "COMBAT_POINTS"; amount: number; note: string }
> = [
  { kind: "XP", skillKey: "creator", amount: 9_400, note: "Demo: Creator progress" },
  { kind: "XP", skillKey: "business", amount: 3_100, note: "Demo: Business progress" },
  { kind: "XP", skillKey: "finance", amount: 1_250, note: "Demo: Finance progress" },
  { kind: "XP", skillKey: "fitness", amount: 5_600, note: "Demo: Fitness progress" },
  { kind: "XP", skillKey: "home", amount: 760, note: "Demo: Home progress" },
  { kind: "XP", skillKey: "focus", amount: 2_300, note: "Demo: Focus progress" },
  { kind: "GP", amount: 147, note: "Demo: GP purse" },
  { kind: "QP", amount: 24, note: "Demo: Quest Points" },
  { kind: "COMBAT_POINTS", amount: 6, note: "Demo: Combat Points" },
];

export async function seedDemoProgression(db: Db, characterId: string) {
  let applied = 0;
  for (const [index, item] of DEMO_PROGRESSION.entries()) {
    const result = await recordProgression(db, characterId, {
      ...item,
      sourceType: "SEED_DEMO",
      sourceId: "demo-progression",
      // Stable keys make re-running the demo seed a no-op.
      idempotencyKey: `seed-demo:${index}`,
      metadata: { note: item.note },
    });
    if (!result.duplicate) applied++;
  }
  return { applied, total: DEMO_PROGRESSION.length };
}
