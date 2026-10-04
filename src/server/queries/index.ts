/**
 * App-facing data access for Server Components. Server-only.
 */

import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { getDb } from "../db/client";
import {
  getCharacterSheet,
  getRecentChronicle,
  resolveCurrentCharacterId,
  toCharacterStatus,
} from "./character-sheet";

export type { CharacterSheet, CharacterStatus, ChronicleEntry, SkillSheet } from "./character-sheet";

/** The current character's full sheet, memoized per request. */
export const loadCharacterSheet = cache(async () => {
  await connection(); // progression is live data: always render at request time
  const db = await getDb();
  const id = await resolveCurrentCharacterId(db);
  return getCharacterSheet(db, id);
});

export const loadCharacterStatus = cache(async () => toCharacterStatus(await loadCharacterSheet()));

export const loadChronicle = cache(async (limit = 6) => {
  const sheet = await loadCharacterSheet();
  return getRecentChronicle(await getDb(), sheet.id, limit);
});
