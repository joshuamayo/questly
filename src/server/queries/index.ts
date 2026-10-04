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
  getRecentXp,
  resolveCurrentCharacterId,
  toCharacterStatus,
} from "./character-sheet";

export { toCharacterStatus } from "./character-sheet";
import { listCollection, listCombatAchievements, listTitlesAndCapes } from "./meta";
import { diaryClaimHistory, getDiary } from "../diaries/service";
import { viewerToday } from "../today";
import { loadSettings, loadBalance } from "../settings/service";
import { getRewardShop } from "../rewards/service";
import { getStreaks } from "../streaks/service";
import { listNeedsAttention } from "../planning/attention";
import { getPlanningView, getToday } from "../planning/service";
import { getOpenRespawn, getRespawnSuggestion, respawnStats } from "../respawn/service";
import { getCurrentBoss, listBossCandidates, listDefeatedBosses } from "./bosses";
import { getQuestlineDetail, listQuestlines } from "./questlines";
import { focusStats, getActiveSession } from "../focus/service";
import {
  getCurrentAdventure,
  getQuestCounts,
  getQuestDetail,
  listQuests,
  listTemplates,
  type JournalView,
} from "./quests";

export type { CharacterSheet, CharacterStatus, ChronicleEntry, SkillSheet, XpEntry } from "./character-sheet";

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

export const loadRecentXp = cache(async (limit = 5) => {
  const sheet = await loadCharacterSheet();
  return getRecentXp(await getDb(), sheet.id, limit);
});

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

export type { QuestDetail, QuestSummary, QuestTemplateView, JournalView } from "./quests";

const currentId = async () => (await loadCharacterSheet()).id;

export const loadQuests = cache(async (view: JournalView) => listQuests(await getDb(), await currentId(), view));
export const loadQuestCounts = cache(async () => getQuestCounts(await getDb(), await currentId()));
export const loadQuestDetail = cache(async (questId: string) => getQuestDetail(await getDb(), await currentId(), questId));
export const loadCurrentAdventure = cache(async () => getCurrentAdventure(await getDb(), await currentId()));
export const loadTemplates = cache(async () => {
  await connection();
  return listTemplates(await getDb());
});

// ---------------------------------------------------------------------------
// Questlines, Bosses, Focus
// ---------------------------------------------------------------------------

export type { QuestlineDetail, QuestlineNode, QuestlineSummary } from "./questlines";
export type { BossView, DefeatedBoss } from "./bosses";

export const loadQuestlines = cache(async () => listQuestlines(await getDb(), await currentId()));
export const loadQuestlineDetail = cache(async (id: string) => getQuestlineDetail(await getDb(), await currentId(), id));
export const loadCurrentBoss = cache(async () => getCurrentBoss(await getDb(), await currentId()));
export const loadDefeatedBosses = cache(async () => listDefeatedBosses(await getDb(), await currentId()));
export const loadBossCandidates = cache(async () => listBossCandidates(await getDb(), await currentId()));
export const loadActiveFocusSession = cache(async () => getActiveSession(await getDb(), await currentId()));
export const loadFocusStats = cache(async () => focusStats(await getDb(), await currentId()));

// ---------------------------------------------------------------------------
// Meta progression
// ---------------------------------------------------------------------------

export type { CombatAchievementView, CollectionItemView, TitleView, CapeView } from "./meta";
export type { DiaryView, DiaryEntryView } from "../diaries/service";

export const loadCombatAchievements = cache(async () => listCombatAchievements(await getDb(), await currentId()));
export const loadCollection = cache(async () => listCollection(await getDb(), await currentId()));
export const loadTitlesAndCapes = cache(async () => listTitlesAndCapes(await getDb(), await currentId()));
export const loadDiary = cache(async (period: "WEEKLY" | "MONTHLY") => getDiary(await getDb(), await currentId(), period, await viewerToday()));
export const loadDiaryHistory = cache(async () => diaryClaimHistory(await getDb(), await currentId()));

// ---------------------------------------------------------------------------
// Rewards, recovery, planning, settings
// ---------------------------------------------------------------------------

export const loadToday = cache(async () => {
  await connection();
  return viewerToday();
});
export const loadSettingsView = cache(async () => loadSettings(await getDb(), await currentId()));
export const loadBalanceView = cache(async () => loadBalance(await getDb(), await currentId()));
export const loadRewardShop = cache(async () => getRewardShop(await getDb(), await currentId()));
export const loadStreaks = cache(async () => getStreaks(await getDb(), await currentId(), await loadToday()));
export const loadNeedsAttention = cache(async () => listNeedsAttention(await getDb(), await currentId(), await loadToday()));
export const loadPlanning = cache(async () => getPlanningView(await getDb(), await currentId(), await loadToday()));
export const loadTodayPlan = cache(async () => getToday(await getDb(), await currentId(), await loadToday()));
export const loadRespawnSuggestion = cache(async () => getRespawnSuggestion(await getDb(), await currentId(), await loadToday()));
export const loadOpenRespawn = cache(async () => getOpenRespawn(await getDb(), await currentId()));
export const loadRespawnStats = cache(async () => respawnStats(await getDb(), await currentId()));
