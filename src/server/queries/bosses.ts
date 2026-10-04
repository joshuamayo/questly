/** Boss read models. */

import { and, desc, eq, inArray } from "drizzle-orm";
import { bossHp, type BountySnapshot } from "@/game/bosses";
import { ACTIVE_QUEST_STATUSES } from "@/game/quests";
import type { Db } from "../db/client";
import { activityEvents, quests } from "../db/schema";
import { getQuestDetail, listQuests, type QuestDetail, type QuestSummary } from "./quests";

export type BossView = QuestDetail & { hp: number; bounty: BountySnapshot | null; designatedAt: string | null };

export async function getCurrentBoss(db: Db, characterId: string): Promise<BossView | null> {
  const [row] = await db
    .select()
    .from(quests)
    .where(and(eq(quests.characterId, characterId), eq(quests.isBoss, true), inArray(quests.status, [...ACTIVE_QUEST_STATUSES])));
  if (!row) return null;
  const detail = await getQuestDetail(db, characterId, row.id);
  return {
    ...detail,
    hp: bossHp(detail.progress),
    bounty: (row.bounty as BountySnapshot | null) ?? null,
    designatedAt: row.bossDesignatedAt?.toISOString() ?? null,
  };
}

export type DefeatedBoss = { id: string; title: string; completedAt: string | null; bountyGp: number; tier: string };

export async function listDefeatedBosses(db: Db, characterId: string): Promise<DefeatedBoss[]> {
  const events = await db
    .select()
    .from(activityEvents)
    .where(and(eq(activityEvents.characterId, characterId), eq(activityEvents.type, "BOSS_DEFEATED")))
    .orderBy(desc(activityEvents.createdAt));
  return events.map((e) => {
    const p = (e.payload ?? {}) as Record<string, unknown>;
    return {
      id: e.entityId ?? e.id,
      title: String(p.title ?? "Boss"),
      completedAt: e.createdAt.toISOString(),
      bountyGp: Number(p.bountyGp ?? 0),
      tier: String(p.tier ?? "NONE"),
    };
  });
}

/** Active Quests that could be designated as the Boss (biggest first). */
export async function listBossCandidates(db: Db, characterId: string): Promise<QuestSummary[]> {
  const order = ["GRANDMASTER", "MASTER", "EXPERIENCED", "INTERMEDIATE", "NOVICE"];
  const active = await listQuests(db, characterId, "active");
  return active.sort((a, b) => order.indexOf(a.difficulty) - order.indexOf(b.difficulty));
}
