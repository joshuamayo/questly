/**
 * Respawn (Product Spec §23) — a guided recovery, never a punishment. Nothing
 * here touches XP, levels, GP, QP, Combat Points, achievements, or the
 * Collection Log. It records the death and the respawn (resilience stats),
 * marks one Respawn Quest, and opens a short lighter-workload window.
 */

import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { RESPAWN } from "@/game/config/balance";
import { GameRuleError } from "@/game/errors";
import { addDays } from "@/game/planning";
import { ACTIVE_QUEST_STATUSES, isActiveStatus } from "@/game/quests";
import { missedWorkdays } from "@/game/streaks";
import { effectiveBalance } from "@/game/settings";
import { respawnSuggestion, type RespawnSuggestion } from "@/game/respawn";
import type { Db } from "../db/client";
import { activityEvents, quests, respawns } from "../db/schema";
import { countNeedsAttention } from "../planning/attention";
import { loadSettings, patchSettings } from "../settings/service";
import { activeDaySet } from "../streaks/service";

export type RespawnTrigger = "MANUAL" | "MISSED_WORKDAYS" | "QUESTS_NEED_ATTENTION";

export async function getRespawnSuggestion(db: Db, characterId: string, today: string): Promise<RespawnSuggestion> {
  const [settings, days, attention, [{ n: questCount }]] = await Promise.all([
    loadSettings(db, characterId),
    activeDaySet(db, characterId),
    countNeedsAttention(db, characterId, today),
    db.select({ n: sql<number>`count(*)::int` }).from(quests).where(and(eq(quests.characterId, characterId), isNotNull(quests.acceptedAt))),
  ]);
  return respawnSuggestion(
    {
      // Missed days only count once the account has some activity history.
      missedWorkdays: days.size ? missedWorkdays(days, settings, today) : 0,
      questsNeedingAttention: attention,
      dismissedUntil: settings.respawnDismissedUntil,
      today,
      hasHistory: questCount > 0,
    },
    effectiveBalance(settings.balance).respawn,
  );
}

export async function dismissRespawn(db: Db, characterId: string, today: string) {
  await patchSettings(db, characterId, { respawnDismissedUntil: addDays(today, RESPAWN.dismissDays) });
}

export async function getOpenRespawn(db: Db, characterId: string) {
  const [row] = await db
    .select()
    .from(respawns)
    .where(and(eq(respawns.characterId, characterId), isNull(respawns.completedAt)))
    .orderBy(desc(respawns.startedAt))
    .limit(1);
  return row ?? null;
}

/** "You Died." Records the death (once per open Respawn). */
export async function beginRespawn(db: Db, characterId: string, trigger: RespawnTrigger) {
  const open = await getOpenRespawn(db, characterId);
  if (open) return open;
  const [row] = await db.insert(respawns).values({ characterId, trigger }).returning();
  await db.insert(activityEvents).values({ characterId, type: "RESPAWN_STARTED", entityId: row.id, payload: { trigger } });
  return row;
}

/** Mark exactly one active Quest as the Respawn Quest. */
export async function chooseRespawnQuest(db: Db, characterId: string, questId: string) {
  return db.transaction(async (tx) => {
    const [quest] = await tx.select().from(quests).where(and(eq(quests.id, questId), eq(quests.characterId, characterId))).for("update");
    if (!quest) throw new GameRuleError("That Quest could not be found.", "QUEST_NOT_FOUND");
    if (!isActiveStatus(quest.status)) throw new GameRuleError("Choose an active Quest as your Respawn Quest.", "QUEST_NOT_ACTIVE");
    await tx
      .update(quests)
      .set({ isRespawnQuest: false })
      .where(and(eq(quests.characterId, characterId), eq(quests.isRespawnQuest, true), inArray(quests.status, [...ACTIVE_QUEST_STATUSES])));
    await tx.update(quests).set({ isRespawnQuest: true, updatedAt: new Date() }).where(eq(quests.id, questId));
    const open = await getOpenRespawn(tx, characterId);
    if (open) await tx.update(respawns).set({ respawnQuestId: questId }).where(eq(respawns.id, open.id));
    await tx.insert(activityEvents).values({ characterId, type: "RESPAWN_QUEST_CHOSEN", entityId: questId, payload: { title: quest.title } });
  });
}

/** Re-enter the World: close the Respawn and start a lighter recovery window. */
export async function completeRespawn(db: Db, characterId: string, today: string) {
  return db.transaction(async (tx) => {
    const open = await getOpenRespawn(tx, characterId);
    if (!open) throw new GameRuleError("There is no Respawn in progress.", "NO_RESPAWN");
    const [chosen] = await tx
      .select({ id: quests.id })
      .from(quests)
      .where(and(eq(quests.characterId, characterId), eq(quests.isRespawnQuest, true), inArray(quests.status, [...ACTIVE_QUEST_STATUSES])));
    if (!chosen) throw new GameRuleError("Choose one Respawn Quest before re-entering the World.", "RESPAWN_QUEST_REQUIRED");
    await tx.update(respawns).set({ completedAt: new Date(), respawnQuestId: chosen.id }).where(eq(respawns.id, open.id));
    await patchSettings(tx, characterId, {
      recoveryUntil: addDays(today, RESPAWN.recoveryDays - 1),
      respawnDismissedUntil: addDays(today, RESPAWN.recoveryDays),
    });
    await tx.insert(activityEvents).values({ characterId, type: "RESPAWNED", entityId: open.id, payload: { respawnQuestId: chosen.id } });
  });
}

/** Resilience stats: deaths are respawns begun; respawns are those completed. */
export async function respawnStats(db: Db, characterId: string) {
  const rows = await db.select({ completedAt: respawns.completedAt }).from(respawns).where(eq(respawns.characterId, characterId));
  return { deaths: rows.length, respawns: rows.filter((r) => r.completedAt).length };
}
