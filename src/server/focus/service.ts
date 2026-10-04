/**
 * Focus sessions. The server owns the clock: qualifying minutes come from
 * stored timestamps, never from the client.
 */

import { and, desc, eq, gte } from "drizzle-orm";
import { assertSessionMinutes, focusXpFor, minimumQualifyingMinutes, qualifyingMinutes, type FocusXpResult } from "@/game/focus";
import { GameRuleError } from "@/game/errors";
import { isActiveStatus } from "@/game/quests";
import type { XpGainResult } from "@/game/xp";
import type { Db } from "../db/client";
import { activityEvents, focusSessions, questObjectives, quests, type FocusSessionRow } from "../db/schema";
import { syncProgression, type MetaUnlocks } from "../meta/sync";
import { recordProgression } from "../progression/service";

export async function getActiveSession(db: Db, characterId: string): Promise<FocusSessionRow | null> {
  const [row] = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.characterId, characterId), eq(focusSessions.status, "ACTIVE")));
  return row ?? null;
}

export async function startFocusSession(
  db: Db,
  characterId: string,
  input: { minutes: number; questId?: string | null; objectiveId?: string | null },
  now: Date = new Date(),
): Promise<FocusSessionRow> {
  assertSessionMinutes(input.minutes);
  return db.transaction(async (tx) => {
    if (await getActiveSession(tx, characterId)) {
      throw new GameRuleError("A Focus session is already running. Finish or end it first.", "SESSION_ACTIVE");
    }
    if (input.questId) {
      const [quest] = await tx.select().from(quests).where(and(eq(quests.id, input.questId), eq(quests.characterId, characterId)));
      if (!quest) throw new GameRuleError("That Quest could not be found.", "QUEST_NOT_FOUND");
      if (!isActiveStatus(quest.status) || quest.status === "ON_HOLD") {
        throw new GameRuleError("Focus sessions can only target an active Quest.", "QUEST_NOT_ACTIVE");
      }
      if (input.objectiveId) {
        const [o] = await tx
          .select()
          .from(questObjectives)
          .where(and(eq(questObjectives.id, input.objectiveId), eq(questObjectives.questId, input.questId)));
        if (!o) throw new GameRuleError("That objective could not be found.", "OBJECTIVE_NOT_FOUND");
      }
    }
    const [session] = await tx
      .insert(focusSessions)
      .values({
        characterId,
        questId: input.questId ?? null,
        objectiveId: input.objectiveId ?? null,
        plannedMinutes: input.minutes,
        startedAt: now,
      })
      .returning();
    return session;
  });
}

export type FocusCompletion = {
  session: FocusSessionRow;
  minutes: number;
  focusXp: FocusXpResult;
  xp: XpGainResult | null;
  minimumMinutes: number;
  meta: MetaUnlocks;
};

/**
 * End a session and award Focus XP for the minutes actually focused, after
 * diminishing returns and the rolling 24-hour cap. Ending a session twice is
 * rejected; XP is awarded at most once per session (idempotency key).
 */
export async function completeFocusSession(db: Db, characterId: string, sessionId: string, now: Date = new Date()): Promise<FocusCompletion> {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(focusSessions)
      .where(and(eq(focusSessions.id, sessionId), eq(focusSessions.characterId, characterId)))
      .for("update");
    if (!session) throw new GameRuleError("That Focus session could not be found.", "SESSION_NOT_FOUND");
    if (session.status !== "ACTIVE") throw new GameRuleError("This Focus session has already ended.", "SESSION_ENDED");

    const minutes = qualifyingMinutes(session.startedAt, now, session.plannedMinutes);
    const since = new Date(now.getTime() - 24 * 3_600_000);
    const recent = await tx
      .select({ minutes: focusSessions.qualifyingMinutes, xp: focusSessions.focusXpAwarded })
      .from(focusSessions)
      .where(and(eq(focusSessions.characterId, characterId), eq(focusSessions.status, "COMPLETED"), gte(focusSessions.endedAt, since)));
    const min = minimumQualifyingMinutes();
    const focusXp = focusXpFor(minutes, {
      qualifyingSessions: recent.filter((r) => r.minutes >= min).length,
      xpEarned: recent.reduce((s, r) => s + r.xp, 0),
    });

    let xp: XpGainResult | null = null;
    if (focusXp.xp > 0) {
      const r = await recordProgression(tx, characterId, {
        kind: "XP",
        skillKey: "focus",
        amount: focusXp.xp,
        sourceType: "FOCUS_SESSION",
        sourceId: session.id,
        idempotencyKey: `focus:${session.id}`,
        metadata: { minutes, multiplier: focusXp.multiplier, capped: focusXp.capped },
      });
      xp = r.xp ?? null;
    }
    const [updated] = await tx
      .update(focusSessions)
      .set({ status: "COMPLETED", endedAt: now, qualifyingMinutes: minutes, focusXpAwarded: xp?.appliedXp ?? 0 })
      .where(eq(focusSessions.id, sessionId))
      .returning();
    await tx.insert(activityEvents).values({
      characterId,
      type: "FOCUS_SESSION_COMPLETED",
      entityId: session.questId ?? session.id,
      payload: { minutes, xp: updated.focusXpAwarded },
    });
    const meta = await syncProgression(tx, characterId);
    return { session: updated, minutes, focusXp, xp, minimumMinutes: min, meta };
  });
}

/** Cancel a running session. No Focus XP; the record is kept. */
export async function cancelFocusSession(db: Db, characterId: string, sessionId: string, now: Date = new Date()) {
  const updated = await db
    .update(focusSessions)
    .set({ status: "CANCELLED", endedAt: now })
    .where(and(eq(focusSessions.id, sessionId), eq(focusSessions.characterId, characterId), eq(focusSessions.status, "ACTIVE")))
    .returning();
  if (!updated.length) throw new GameRuleError("This Focus session has already ended.", "SESSION_ENDED");
}

export async function focusStats(db: Db, characterId: string) {
  const rows = await db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.characterId, characterId), eq(focusSessions.status, "COMPLETED")))
    .orderBy(desc(focusSessions.endedAt));
  const since = Date.now() - 24 * 3_600_000;
  const recent = rows.filter((r) => r.endedAt && r.endedAt.getTime() >= since);
  return {
    sessions: rows.length,
    minutes: rows.reduce((s, r) => s + r.qualifyingMinutes, 0),
    last24h: { sessions: recent.length, minutes: recent.reduce((s, r) => s + r.qualifyingMinutes, 0), xp: recent.reduce((s, r) => s + r.focusXpAwarded, 0) },
  };
}
