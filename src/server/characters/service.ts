/** Character lifecycle. A new character starts with an empty Quest Log and 0 GP. */

import { DEFAULT_AVATAR, type AvatarConfig } from "@/game/avatar";
import { GameRuleError } from "@/game/errors";
import type { Db } from "../db/client";
import { characters } from "../db/schema";

export type CreateCharacterInput = { displayName: string; avatar?: AvatarConfig; authSubject?: string | null };

export async function createCharacter(db: Db, input: CreateCharacterInput) {
  const displayName = input.displayName.trim();
  if (!displayName) throw new GameRuleError("A character needs a display name.", "NAME_REQUIRED");
  const [character] = await db
    .insert(characters)
    .values({ displayName, authSubject: input.authSubject ?? null, avatarConfig: input.avatar ?? DEFAULT_AVATAR })
    .returning();
  return character;
}
