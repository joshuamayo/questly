/**
 * Character lifecycle. Creating a character initializes all six Skills at
 * 0 XP (Level 1), grants starter Titles, and records the founding event.
 */

import { eq } from "drizzle-orm";
import { DEFAULT_AVATAR, type AvatarConfig } from "@/game/avatar";
import type { Db } from "../db/client";
import { activityEvents, characterSkills, characterTitles, characters, skills, titles } from "../db/schema";

export type CreateCharacterInput = {
  displayName: string;
  avatar?: AvatarConfig;
  authSubject?: string | null;
};

export async function createCharacter(db: Db, input: CreateCharacterInput) {
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("A character needs a display name.");

  return db.transaction(async (tx) => {
    const starterTitles = await tx.select().from(titles).where(eq(titles.isStarter, true));
    const allSkills = await tx.select({ key: skills.key }).from(skills);
    if (allSkills.length === 0) {
      throw new Error("Skills have not been seeded. Run `npm run db:seed` first.");
    }

    const [character] = await tx
      .insert(characters)
      .values({
        displayName,
        authSubject: input.authSubject ?? null,
        avatarConfig: input.avatar ?? DEFAULT_AVATAR,
        equippedTitleKey: starterTitles[0]?.key ?? null,
      })
      .returning();

    await tx.insert(characterSkills).values(allSkills.map((s) => ({ characterId: character.id, skillKey: s.key, xp: 0 })));
    if (starterTitles.length) {
      await tx.insert(characterTitles).values(starterTitles.map((t) => ({ characterId: character.id, titleKey: t.key })));
    }
    await tx.insert(activityEvents).values({
      characterId: character.id,
      type: "CHARACTER_CREATED",
      entityId: character.id,
      payload: { displayName },
    });
    return character;
  });
}
