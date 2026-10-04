"use server";

import type { AvatarConfig } from "@/game/avatar";
import type { CharacterSettings } from "@/game/settings";
import { runAction } from "@/server/actions/run";
import { updateProfile, updateSettings } from "@/server/settings/service";

export async function updateSettingsAction(patch: Partial<CharacterSettings>) {
  return runAction(async (db, c) => {
    await updateSettings(db, c, patch);
  });
}

export async function updateProfileAction(input: { displayName?: string; avatar?: AvatarConfig }) {
  return runAction((db, c) => updateProfile(db, c, input));
}
