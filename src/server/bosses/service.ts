/**
 * Boss designation. Exactly one active Boss per character: designating a new
 * Boss stands the previous one down (it stays an ordinary active Quest).
 */

import { and, eq, inArray, ne } from "drizzle-orm";
import { snapshotBounty } from "@/game/bosses";
import { GameRuleError } from "@/game/errors";
import { ACTIVE_QUEST_STATUSES, isActiveStatus } from "@/game/quests";
import type { Db } from "../db/client";
import { activityEvents, quests } from "../db/schema";

export async function designateBoss(db: Db, characterId: string, questId: string) {
  return db.transaction(async (tx) => {
    const [quest] = await tx
      .select()
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.characterId, characterId)))
      .for("update");
    if (!quest) throw new GameRuleError("That Quest could not be found.", "QUEST_NOT_FOUND");
    if (!isActiveStatus(quest.status)) throw new GameRuleError("Only an active Quest can be your Boss.", "BOSS_NOT_ACTIVE");
    if (quest.isBoss) return quest;
    await tx
      .update(quests)
      .set({ isBoss: false, bounty: null, bossDesignatedAt: null })
      .where(
        and(
          eq(quests.characterId, characterId),
          eq(quests.isBoss, true),
          ne(quests.id, questId),
          inArray(quests.status, [...ACTIVE_QUEST_STATUSES]),
        ),
      );
    const [updated] = await tx
      .update(quests)
      .set({ isBoss: true, bounty: snapshotBounty(), bossDesignatedAt: new Date(), updatedAt: new Date() })
      .where(eq(quests.id, questId))
      .returning();
    await tx.insert(activityEvents).values({ characterId, type: "BOSS_DESIGNATED", entityId: questId, payload: { title: quest.title } });
    return updated;
  });
}

/** Stand a Boss down. Normal Quest rewards are unaffected; the bounty is removed. */
export async function clearBoss(db: Db, characterId: string, questId: string) {
  const updated = await db
    .update(quests)
    .set({ isBoss: false, bounty: null, bossDesignatedAt: null, updatedAt: new Date() })
    .where(and(eq(quests.id, questId), eq(quests.characterId, characterId), eq(quests.isBoss, true), inArray(quests.status, [...ACTIVE_QUEST_STATUSES])))
    .returning();
  if (!updated.length) throw new GameRuleError("That Quest is not your current Boss.", "NOT_BOSS");
}
