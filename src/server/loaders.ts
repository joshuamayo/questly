/** Per-request cached loaders for Server Components. Server-only. */

import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { getDb } from "./db/client";
import { resolveCurrentCharacterId } from "./auth/session";
import { getCompleted, getProfile, getQuestLog, type CompletedQuery } from "./queries";
import { getRewardShop } from "./rewards/service";

export type { Profile, QuestLog, QuestView, CompletedView } from "./queries";

export const loadProfile = cache(async () => {
  await connection(); // live data: always render at request time
  const db = await getDb();
  return getProfile(db, await resolveCurrentCharacterId(db));
});

export const loadQuestLog = cache(async () => {
  const profile = await loadProfile();
  return getQuestLog(await getDb(), profile.id, profile.gpBalance);
});

export const loadCompleted = cache(async (page: number, search: string, month: string | null) => {
  const profile = await loadProfile();
  const query: CompletedQuery = { page, search, month };
  return getCompleted(await getDb(), profile.id, query);
});

export const loadRewardShop = cache(async () => {
  const profile = await loadProfile();
  return getRewardShop(await getDb(), profile.id);
});
