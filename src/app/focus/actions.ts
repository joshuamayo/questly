"use server";

import { runAction } from "@/server/actions/run";
import { actionToday } from "@/server/today";
import { cancelFocusSession, completeFocusSession, startFocusSession } from "@/server/focus/service";

export async function startFocusAction(input: { minutes: number; questId?: string | null; objectiveId?: string | null }) {
  return runAction(async (db, c) => {
    const s = await startFocusSession(db, c, input);
    return { id: s.id, startedAt: s.startedAt.toISOString(), plannedMinutes: s.plannedMinutes };
  });
}

export async function completeFocusAction(sessionId: string) {
  return runAction(async (db, c) => {
    const r = await completeFocusSession(db, c, sessionId, new Date(), await actionToday());
    return {
      minutes: r.minutes,
      xp: r.focusXp.xp,
      capped: r.focusXp.capped,
      multiplier: r.focusXp.multiplier,
      minimumMinutes: r.minimumMinutes,
      leveledUp: r.xp?.leveledUp ?? false,
      newLevel: r.xp?.newLevel ?? null,
      achievements: r.meta.achievements.map((a) => a.title),
      collection: r.meta.collection.map((c) => c.title),
    };
  });
}

export async function cancelFocusAction(sessionId: string) {
  return runAction((db, c) => cancelFocusSession(db, c, sessionId));
}
