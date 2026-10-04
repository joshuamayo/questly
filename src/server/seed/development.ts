/**
 * Development seed data. `npm run db:setup` creates the local character with
 * an empty Quest Log and 0 GP. Demo content is opt-in (`npm run db:seed:demo`)
 * and goes through the real services, so GP is always ledgered.
 */

import { asc } from "drizzle-orm";
import type { AvatarConfig } from "@/game/avatar";
import type { Db } from "../db/client";
import { characters } from "../db/schema";
import { createCharacter } from "../characters/service";
import { completeQuest, createQuest } from "../quests/service";
import { addSuggestedRewards, setFeaturedGoal } from "../rewards/service";
import { activeQuests } from "../quests/service";
import { getRewardShop } from "../rewards/service";

export const DEV_CHARACTER = {
  displayName: "Joshua",
  avatar: { version: 1, skinTone: "sand", hairStyle: "short", hairColor: "chestnut", tunicColor: "moss", beard: true } satisfies AvatarConfig,
};

/** Creates the development character if no character exists yet. */
export async function seedDevelopmentCharacter(db: Db) {
  const [existing] = await db.select().from(characters).orderBy(asc(characters.createdAt)).limit(1);
  if (existing) return { character: existing, created: false };
  return { character: await createCharacter(db, DEV_CHARACTER), created: true };
}

const DEMO_QUESTS: { title: string; gpReward: number; description?: string }[] = [
  { title: "Write next YouTube script", gpReward: 15 },
  { title: "Record video", gpReward: 20 },
  { title: "Send video to editor", gpReward: 10 },
  { title: "Install backyard lights", gpReward: 20 },
  { title: "Finish tax documents", gpReward: 30, description: "Gather income records, deductions, and receipts, then file." },
  { title: "Plan next video ideas", gpReward: 15 },
];

/** Adds demo Quests (completing the first two) and starter rewards — only into an empty account. */
export async function seedDemo(db: Db, characterId: string) {
  if ((await activeQuests(db, characterId)).length === 0) {
    for (const q of DEMO_QUESTS) await createQuest(db, characterId, q);
    for (let i = 0; i < 2; i++) {
      const [current] = await activeQuests(db, characterId);
      await completeQuest(db, characterId, current.id);
    }
  }
  const shop = await getRewardShop(db, characterId);
  if (shop.rewards.length === 0) {
    await addSuggestedRewards(db, characterId);
    const after = await getRewardShop(db, characterId);
    const goal = after.rewards.find((r) => r.name === "New Tech / Gear");
    if (goal) await setFeaturedGoal(db, characterId, goal.id);
  }
}
