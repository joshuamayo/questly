/** Character settings and profile. Settings are JSON on the character, normalized on read. */

import { eq } from "drizzle-orm";
import { normalizeAvatar, type AvatarConfig } from "@/game/avatar";
import { GameRuleError } from "@/game/errors";
import { normalizeSettings, validateSettingsPatch, type CharacterSettings } from "@/game/settings";
import type { Db } from "../db/client";
import { characters } from "../db/schema";

export async function loadSettings(db: Db, characterId: string): Promise<CharacterSettings> {
  const [c] = await db.select({ settings: characters.settings }).from(characters).where(eq(characters.id, characterId));
  return normalizeSettings(c?.settings);
}

export async function updateSettings(db: Db, characterId: string, patch: Partial<CharacterSettings>) {
  const clean = validateSettingsPatch(patch);
  const next = { ...(await loadSettings(db, characterId)), ...clean };
  await db.update(characters).set({ settings: next }).where(eq(characters.id, characterId));
  return next;
}

export async function updateProfile(db: Db, characterId: string, input: { displayName?: string; avatar?: AvatarConfig }) {
  const set: { displayName?: string; avatarConfig?: AvatarConfig } = {};
  if (input.displayName !== undefined) {
    const name = input.displayName.trim();
    if (!name) throw new GameRuleError("Your character needs a name.", "NAME_REQUIRED");
    if (name.length > 40) throw new GameRuleError("Names must be 40 characters or fewer.", "NAME_TOO_LONG");
    set.displayName = name;
  }
  if (input.avatar !== undefined) set.avatarConfig = normalizeAvatar(input.avatar);
  if (Object.keys(set).length) await db.update(characters).set(set).where(eq(characters.id, characterId));
}
