/**
 * Quest Log service. Every mutation locks the character row first, so order
 * changes and completions are serialized per player; active positions are
 * always rewritten as a contiguous 0..n-1 sequence (deterministic, no gaps or
 * duplicates). The Current Quest is derived, never stored.
 */

import { and, asc, eq } from "drizzle-orm";
import { CharacterNotFoundError } from "@/game/errors";
import {
  insertIndex,
  moveInOrder,
  NOT_CURRENT_MESSAGE,
  QuestRuleError,
  validateQuestInput,
  type InsertPosition,
  type QuestInput,
} from "@/game/quests";
import type { Db } from "../db/client";
import { characters, quests, type QuestRow } from "../db/schema";
import { earnGp } from "../gp/service";
import { loadSettings } from "../settings/service";

export class QuestNotFoundError extends QuestRuleError {
  constructor() {
    super("That quest could not be found.", "QUEST_NOT_FOUND");
  }
}

async function lockCharacter(db: Db, characterId: string) {
  const [c] = await db.select({ id: characters.id }).from(characters).where(eq(characters.id, characterId)).for("update");
  if (!c) throw new CharacterNotFoundError(characterId);
}

/** Active Quests in Quest Log order. */
export async function activeQuests(db: Db, characterId: string): Promise<QuestRow[]> {
  return db
    .select()
    .from(quests)
    .where(and(eq(quests.characterId, characterId), eq(quests.status, "active")))
    .orderBy(asc(quests.position), asc(quests.createdAt), asc(quests.id));
}

/** Rewrite positions to match `ids` (0..n-1). Only touches rows whose position changes. */
async function writeOrder(db: Db, rows: readonly QuestRow[], ids: readonly string[]) {
  const current = new Map(rows.map((r) => [r.id, r.position]));
  const now = new Date();
  for (let i = 0; i < ids.length; i++) {
    if (current.get(ids[i]) !== i) await db.update(quests).set({ position: i, updatedAt: now }).where(eq(quests.id, ids[i]));
  }
}

async function ownQuest(db: Db, characterId: string, questId: string) {
  const [q] = await db.select().from(quests).where(and(eq(quests.id, questId), eq(quests.characterId, characterId)));
  if (!q) throw new QuestNotFoundError();
  return q;
}

// ---------------------------------------------------------------------------
// Add / edit / remove
// ---------------------------------------------------------------------------

export async function createQuest(db: Db, characterId: string, input: QuestInput & { position?: InsertPosition }): Promise<QuestRow> {
  const settings = await loadSettings(db, characterId);
  const clean = validateQuestInput(input, settings.defaultQuestGp);
  return db.transaction(async (tx) => {
    await lockCharacter(tx, characterId);
    const rows = await activeQuests(tx, characterId);
    const [quest] = await tx
      .insert(quests)
      .values({ characterId, ...clean, status: "active", position: rows.length })
      .returning();
    const ids = rows.map((r) => r.id);
    ids.splice(insertIndex(input.position, rows.length), 0, quest.id);
    await writeOrder(tx, [...rows, quest], ids);
    return { ...quest, position: ids.indexOf(quest.id) };
  });
}

/** Edit an unfinished Quest. Completed history is not editable (spec §23). */
export async function updateQuest(db: Db, characterId: string, questId: string, input: Partial<QuestInput>) {
  return db.transaction(async (tx) => {
    await lockCharacter(tx, characterId);
    const quest = await ownQuest(tx, characterId, questId);
    if (quest.status !== "active") throw new QuestRuleError("Completed quests are part of your history and can't be edited.", "QUEST_NOT_ACTIVE");
    const merged = validateQuestInput({
      title: input.title ?? quest.title,
      description: input.description ?? quest.description,
      gpReward: input.gpReward ?? quest.gpReward,
    });
    const [updated] = await tx.update(quests).set({ ...merged, updatedAt: new Date() }).where(eq(quests.id, questId)).returning();
    return updated;
  });
}

/** Remove an unfinished Quest from the log. It is archived (kept), never awarded. */
export async function archiveQuest(db: Db, characterId: string, questId: string) {
  return db.transaction(async (tx) => {
    await lockCharacter(tx, characterId);
    const quest = await ownQuest(tx, characterId, questId);
    if (quest.status !== "active") throw new QuestRuleError("Only quests in your Quest Log can be removed.", "QUEST_NOT_ACTIVE");
    const now = new Date();
    await tx.update(quests).set({ status: "archived", archivedAt: now, updatedAt: now }).where(eq(quests.id, questId));
    const rows = await activeQuests(tx, characterId);
    await writeOrder(tx, rows, rows.map((r) => r.id));
  });
}

/** Put an archived Quest back at the end of the log. */
export async function restoreQuest(db: Db, characterId: string, questId: string) {
  return db.transaction(async (tx) => {
    await lockCharacter(tx, characterId);
    const quest = await ownQuest(tx, characterId, questId);
    if (quest.status !== "archived") throw new QuestRuleError("Only removed quests can be restored.", "QUEST_NOT_ARCHIVED");
    const rows = await activeQuests(tx, characterId);
    await tx.update(quests).set({ status: "active", archivedAt: null, position: rows.length, updatedAt: new Date() }).where(eq(quests.id, questId));
  });
}

// ---------------------------------------------------------------------------
// Reordering
// ---------------------------------------------------------------------------

/** Move one Quest to `toIndex` (0 = Current). */
export async function moveQuest(db: Db, characterId: string, questId: string, toIndex: number) {
  if (!Number.isInteger(toIndex)) throw new QuestRuleError("Choose a position in the Quest Log.", "INVALID_POSITION");
  return db.transaction(async (tx) => {
    await lockCharacter(tx, characterId);
    const rows = await activeQuests(tx, characterId);
    const ids = moveInOrder(rows.map((r) => r.id), questId, toIndex);
    await writeOrder(tx, rows, ids);
    return ids;
  });
}

/**
 * Apply a full new order (drag and drop). The list must contain exactly the
 * current active Quests; otherwise the client is stale and nothing changes.
 */
export async function reorderQuests(db: Db, characterId: string, orderedIds: readonly string[]) {
  return db.transaction(async (tx) => {
    await lockCharacter(tx, characterId);
    const rows = await activeQuests(tx, characterId);
    const expected = new Set(rows.map((r) => r.id));
    const unique = new Set(orderedIds);
    if (unique.size !== orderedIds.length || unique.size !== expected.size || orderedIds.some((id) => !expected.has(id))) {
      throw new QuestRuleError("Your Quest Log changed since this page loaded. It has been refreshed — try again.", "STALE_ORDER");
    }
    await writeOrder(tx, rows, orderedIds);
  });
}

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

export type QuestCompletion = {
  /** True when this Quest was already complete; nothing was awarded again. */
  duplicate: boolean;
  quest: { id: string; title: string; gpReward: number };
  gpEarned: number;
  gpBalance: number;
  /** The new Current Quest, if any. */
  next: { id: string; title: string; gpReward: number } | null;
};

/**
 * Complete the Current Quest: mark it complete, award its stored GP exactly
 * once, and let the next Quest become Current. Locked Quests are rejected
 * here, not just in the UI. Repeating the request is safe.
 */
export async function completeQuest(db: Db, characterId: string, questId: string): Promise<QuestCompletion> {
  return db.transaction(async (tx) => {
    await lockCharacter(tx, characterId);
    const quest = await ownQuest(tx, characterId, questId);
    const summary = { id: quest.id, title: quest.title, gpReward: quest.gpReward };

    if (quest.status === "completed") {
      const [next] = await activeQuests(tx, characterId);
      const [c] = await tx.select({ gp: characters.gpBalance }).from(characters).where(eq(characters.id, characterId));
      return { duplicate: true, quest: summary, gpEarned: 0, gpBalance: c.gp, next: next ? { id: next.id, title: next.title, gpReward: next.gpReward } : null };
    }
    if (quest.status !== "active") throw new QuestRuleError("This quest was removed from your Quest Log. Restore it to complete it.", "QUEST_NOT_ACTIVE");

    const rows = await activeQuests(tx, characterId);
    if (rows[0]?.id !== questId) throw new QuestRuleError(NOT_CURRENT_MESSAGE, "NOT_CURRENT");

    const now = new Date();
    await tx.update(quests).set({ status: "completed", completedAt: now, updatedAt: now }).where(eq(quests.id, questId));
    const remaining = rows.slice(1);
    await writeOrder(tx, remaining, remaining.map((r) => r.id));

    let gpBalance: number;
    if (quest.gpReward > 0) {
      gpBalance = (
        await earnGp(tx, characterId, quest.gpReward, {
          sourceType: "QUEST",
          sourceId: quest.id,
          description: quest.title,
          idempotencyKey: `quest:${quest.id}`,
        })
      ).gpBalance;
    } else {
      const [c] = await tx.select({ gp: characters.gpBalance }).from(characters).where(eq(characters.id, characterId));
      gpBalance = c.gp;
    }
    const next = remaining[0];
    return { duplicate: false, quest: summary, gpEarned: quest.gpReward, gpBalance, next: next ? { id: next.id, title: next.title, gpReward: next.gpReward } : null };
  });
}

