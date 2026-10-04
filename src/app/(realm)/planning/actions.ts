"use server";

import type { DiaryTier } from "@/game/vocabulary";
import { runAction } from "@/server/actions/run";
import { addCustomEntry, removeCustomEntry } from "@/server/diaries/service";
import { confirmPlan, getWeekStartFor, setPlanItem } from "@/server/planning/service";
import { actionToday } from "@/server/today";

export async function setPlanItemAction(input: { weekStart: string; day: string; questId: string; planned: boolean }) {
  return runAction(async (db, c) => setPlanItem(db, c, input, await actionToday()));
}

export async function confirmPlanAction(weekStart: string) {
  return runAction(async (db, c) => confirmPlan(db, c, weekStart, await actionToday()));
}

/** Add a custom entry to the Weekly Diary of the week being planned. */
export async function addPlanDiaryEntryAction(tier: DiaryTier, title: string) {
  return runAction(async (db, c) => {
    const { weekStart } = await getWeekStartFor(db, c, await actionToday());
    await addCustomEntry(db, c, "WEEKLY", tier, title, weekStart);
  });
}

export async function removePlanDiaryEntryAction(entryId: string) {
  return runAction((db, c) => removeCustomEntry(db, c, entryId));
}
