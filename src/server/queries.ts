/**
 * Read models for the four screens. Pure data access (no `server-only`), so
 * tests can call them directly; `src/server/loaders.ts` wraps them per request.
 */

import { and, asc, count, desc, eq, gte, ilike, lt, sql } from "drizzle-orm";
import { normalizeAvatar, type AvatarConfig } from "@/game/avatar";
import { CharacterNotFoundError } from "@/game/errors";
import { deriveQuestLog } from "@/game/quests";
import { savingsProgress } from "@/game/rewards";
import { normalizeSettings, type CharacterSettings } from "@/game/settings";
import type { Db } from "./db/client";
import { characters, quests, rewards } from "./db/schema";
import { activeQuests } from "./quests/service";

/** The oldest character — local single-player mode (no sign-in). */
export async function firstCharacterId(db: Db): Promise<string> {
  const [row] = await db.select({ id: characters.id }).from(characters).orderBy(asc(characters.createdAt)).limit(1);
  if (!row) throw new CharacterNotFoundError();
  return row.id;
}

export type Profile = {
  id: string;
  displayName: string;
  avatar: AvatarConfig;
  gpBalance: number;
  lifetimeGpEarned: number;
  settings: CharacterSettings;
};

export async function getProfile(db: Db, characterId: string): Promise<Profile> {
  const [c] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!c) throw new CharacterNotFoundError(characterId);
  return {
    id: c.id,
    displayName: c.displayName,
    avatar: normalizeAvatar(c.avatarConfig),
    gpBalance: c.gpBalance,
    lifetimeGpEarned: c.lifetimeGpEarned,
    settings: normalizeSettings(c.settings),
  };
}

export type QuestView = { id: string; title: string; description: string; gpReward: number };
export type CompletedView = QuestView & { completedAt: string };

const toView = (q: { id: string; title: string; description: string; gpReward: number }): QuestView => ({
  id: q.id,
  title: q.title,
  description: q.description,
  gpReward: q.gpReward,
});

export type QuestLog = {
  current: QuestView | null;
  locked: QuestView[];
  /** Most recent completions, newest first (a short preview, never full history). */
  recent: CompletedView[];
  completedCount: number;
  savingsGoal: { id: string; name: string; icon: string; current: number; target: number; percent: number } | null;
};

export async function getQuestLog(db: Db, characterId: string, gpBalance: number, recentLimit = 5): Promise<QuestLog> {
  const [active, recent, [{ n }], [goal]] = await Promise.all([
    activeQuests(db, characterId),
    db
      .select()
      .from(quests)
      .where(and(eq(quests.characterId, characterId), eq(quests.status, "completed")))
      .orderBy(desc(quests.completedAt))
      .limit(recentLimit),
    db.select({ n: count() }).from(quests).where(and(eq(quests.characterId, characterId), eq(quests.status, "completed"))),
    db.select().from(rewards).where(and(eq(rewards.characterId, characterId), eq(rewards.featuredGoal, true), eq(rewards.active, true))),
  ]);
  const { current, locked } = deriveQuestLog(active);
  return {
    current: current ? toView(current) : null,
    locked: locked.map(toView),
    recent: recent.map((q) => ({ ...toView(q), completedAt: q.completedAt!.toISOString() })),
    completedCount: n,
    savingsGoal: goal ? { id: goal.id, name: goal.name, icon: goal.icon, ...savingsProgress(gpBalance, goal.gpCost) } : null,
  };
}

export const COMPLETED_PAGE_SIZE = 25;

export type CompletedQuery = { page?: number; search?: string; month?: string | null };

/**
 * Completed history, newest first, paginated server-side (it can grow very
 * large). `month` is YYYY-MM; bounds are computed in UTC.
 */
export async function getCompleted(db: Db, characterId: string, query: CompletedQuery = {}) {
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const filters = [eq(quests.characterId, characterId), eq(quests.status, "completed")];
  const search = query.search?.trim().slice(0, 100);
  if (search) filters.push(ilike(quests.title, `%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`));
  if (query.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month)) {
    const [y, m] = query.month.split("-").map(Number);
    filters.push(gte(quests.completedAt, new Date(Date.UTC(y, m - 1, 1))), lt(quests.completedAt, new Date(Date.UTC(y, m, 1))));
  }
  const where = and(...filters);
  const [rows, [{ n }], [{ total }], months] = await Promise.all([
    db.select().from(quests).where(where).orderBy(desc(quests.completedAt), desc(quests.id)).limit(COMPLETED_PAGE_SIZE).offset((page - 1) * COMPLETED_PAGE_SIZE),
    db.select({ n: count() }).from(quests).where(where),
    db.select({ total: count() }).from(quests).where(and(eq(quests.characterId, characterId), eq(quests.status, "completed"))),
    db
      .selectDistinct({ month: sql<string>`to_char(${quests.completedAt} at time zone 'UTC', 'YYYY-MM')` })
      .from(quests)
      .where(and(eq(quests.characterId, characterId), eq(quests.status, "completed")))
      .orderBy(desc(sql`1`)),
  ]);
  return {
    items: rows.map((q) => ({ ...toView(q), completedAt: q.completedAt!.toISOString() })),
    page,
    pages: Math.max(1, Math.ceil(n / COMPLETED_PAGE_SIZE)),
    matching: n,
    total,
    months: months.map((m) => m.month),
  };
}
