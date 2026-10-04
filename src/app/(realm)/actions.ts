"use server";

import type { InsertPosition, QuestInput } from "@/game/quests";
import { runAction } from "@/server/actions/run";
import { archiveQuest, completeQuest, createQuest, moveQuest, reorderQuests, restoreQuest, updateQuest } from "@/server/quests/service";

export type { ActionResult } from "@/server/actions/run";

export async function addQuestAction(input: QuestInput & { position?: InsertPosition }) {
  return runAction(async (db, c) => {
    const q = await createQuest(db, c, input);
    return { id: q.id, title: q.title };
  });
}

export async function updateQuestAction(questId: string, input: Partial<QuestInput>) {
  return runAction(async (db, c) => {
    await updateQuest(db, c, questId, input);
  });
}

export async function removeQuestAction(questId: string) {
  return runAction((db, c) => archiveQuest(db, c, questId));
}

/** Undo a removal: restore the quest and put it back where it was. */
export async function undoRemoveQuestAction(questId: string, index: number) {
  return runAction(async (db, c) => {
    await restoreQuest(db, c, questId);
    await moveQuest(db, c, questId, index);
  });
}

export async function moveQuestAction(questId: string, toIndex: number) {
  return runAction(async (db, c) => {
    await moveQuest(db, c, questId, toIndex);
  });
}

export async function reorderQuestsAction(orderedIds: string[]) {
  return runAction((db, c) => reorderQuests(db, c, orderedIds));
}

export async function completeQuestAction(questId: string) {
  return runAction((db, c) => completeQuest(db, c, questId));
}
