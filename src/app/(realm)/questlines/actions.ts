"use server";

import type { QuestPriority } from "@/game/quests";
import { runAction } from "@/server/actions/run";
import { acceptQuestlineQuest, archiveQuestline, createQuestline, type QuestlineInput } from "@/server/questlines/service";
import { setManualRequirement, trustedLocalDate } from "@/server/requirements/service";

export async function createQuestlineAction(input: QuestlineInput) {
  return runAction(async (db, c) => (await createQuestline(db, c, input)).questline.id);
}

export async function acceptQuestlineQuestAction(
  questId: string,
  options: { targetDate?: string | null; deadline?: string | null; priority?: QuestPriority },
  localDate?: string,
) {
  return runAction(async (db, c) => (await acceptQuestlineQuest(db, c, questId, { ...options, today: trustedLocalDate(localDate) })).id);
}

export async function setManualRequirementAction(requirementId: string, met: boolean) {
  return runAction((db, c) => setManualRequirement(db, c, requirementId, met));
}

export async function archiveQuestlineAction(questlineId: string) {
  return runAction((db, c) => archiveQuestline(db, c, questlineId));
}
