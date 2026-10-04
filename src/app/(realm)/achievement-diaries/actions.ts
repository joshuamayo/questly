"use server";

import type { DiaryPeriod } from "@/game/content/diaries";
import type { DiaryTier } from "@/game/vocabulary";
import { runAction } from "@/server/actions/run";
import { addCustomEntry, claimDiaryTier, removeCustomEntry, setCustomEntryDone } from "@/server/diaries/service";
import { trustedLocalDate } from "@/server/requirements/service";

export async function claimDiaryTierAction(period: DiaryPeriod, tier: DiaryTier, localDate?: string) {
  return runAction((db, c) => claimDiaryTier(db, c, period, tier, trustedLocalDate(localDate)));
}

export async function addDiaryEntryAction(period: DiaryPeriod, tier: DiaryTier, title: string, localDate?: string) {
  return runAction(async (db, c) => {
    await addCustomEntry(db, c, period, tier, title, trustedLocalDate(localDate));
  });
}

export async function setDiaryEntryDoneAction(entryId: string, done: boolean) {
  return runAction((db, c) => setCustomEntryDone(db, c, entryId, done));
}

export async function removeDiaryEntryAction(entryId: string) {
  return runAction((db, c) => removeCustomEntry(db, c, entryId));
}
