"use server";

import { runAction } from "@/server/actions/run";
import { beginRespawn, chooseRespawnQuest, completeRespawn, dismissRespawn, type RespawnTrigger } from "@/server/respawn/service";
import { actionToday } from "@/server/today";

export async function beginRespawnAction(trigger: RespawnTrigger) {
  return runAction(async (db, c) => {
    await beginRespawn(db, c, trigger);
  });
}

export async function chooseRespawnQuestAction(questId: string) {
  return runAction((db, c) => chooseRespawnQuest(db, c, questId));
}

export async function completeRespawnAction() {
  return runAction(async (db, c) => completeRespawn(db, c, await actionToday()));
}

export async function dismissRespawnAction() {
  return runAction(async (db, c) => dismissRespawn(db, c, await actionToday()));
}
