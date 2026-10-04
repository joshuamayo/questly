/**
 * Quests Need Attention (Product Spec §22): active Quests whose target date
 * or hard deadline has passed. Each needs a decision — Continue, Rescope, or
 * Abandon. Original dates stay in the Quest's date history.
 */

import { and, eq, inArray } from "drizzle-orm";
import { GameRuleError } from "@/game/errors";
import { attentionReason, type AttentionReason } from "@/game/planning";
import { ACTIVE_QUEST_STATUSES, normalizeDate, type QuestStatus } from "@/game/quests";
import type { Db } from "../db/client";
import { activityEvents, quests } from "../db/schema";
import { listQuests, type QuestSummary } from "../queries/quests";
import { updateQuestDetails, resumeQuest } from "../quests/service";

export type AttentionItem = QuestSummary & { reason: AttentionReason };

export async function listNeedsAttention(db: Db, characterId: string, today: string): Promise<AttentionItem[]> {
  const active = await listQuests(db, characterId, "active");
  return active
    .map((q) => ({ ...q, reason: attentionReason(q, today) }))
    .filter((q): q is AttentionItem => q.reason !== null)
    .sort((a, b) => (a.reason === b.reason ? 0 : a.reason === "PAST_DEADLINE" ? -1 : 1));
}

export async function countNeedsAttention(db: Db, characterId: string, today: string): Promise<number> {
  const rows = await db
    .select({ status: quests.status, targetDate: quests.targetDate, deadline: quests.deadline })
    .from(quests)
    .where(and(eq(quests.characterId, characterId), inArray(quests.status, [...ACTIVE_QUEST_STATUSES])));
  return rows.filter((r) => attentionReason(r, today)).length;
}

/**
 * Continue (or Rescope) a Quest with a new realistic target. If its hard
 * deadline has passed, the player must set a new one or remove it — a
 * missed deadline is never silently erased (the history keeps it).
 */
export async function continueQuest(
  db: Db,
  characterId: string,
  questId: string,
  input: { targetDate: string; deadline?: string | null },
  today: string,
  reason: "CONTINUE" | "RESCOPE" | "RESPAWN" = "CONTINUE",
) {
  const targetDate = normalizeDate(input.targetDate, "New target date");
  if (!targetDate) throw new GameRuleError("Choose a new target date.", "TARGET_REQUIRED");
  if (targetDate < today) throw new GameRuleError("The new target date should be today or later.", "TARGET_IN_PAST");
  const [quest] = await db.select().from(quests).where(and(eq(quests.id, questId), eq(quests.characterId, characterId)));
  if (!quest) throw new GameRuleError("That Quest could not be found.", "QUEST_NOT_FOUND");
  const patch: { targetDate: string; deadline?: string | null; reason: typeof reason } = { targetDate, reason };
  if (input.deadline !== undefined) {
    const deadline = normalizeDate(input.deadline, "New hard deadline");
    if (deadline && deadline < today) throw new GameRuleError("The new hard deadline should be today or later.", "DEADLINE_IN_PAST");
    patch.deadline = deadline;
  } else if (quest.deadline && quest.deadline < today) {
    throw new GameRuleError("The hard deadline has passed. Set a new one or remove it.", "DEADLINE_PASSED");
  }
  await updateQuestDetails(db, characterId, questId, patch);
  if ((quest.status as QuestStatus) === "ON_HOLD") await resumeQuest(db, characterId, questId);
  await db.insert(activityEvents).values({ characterId, type: "QUEST_CONTINUED", entityId: questId, payload: { targetDate, reason } });
}
