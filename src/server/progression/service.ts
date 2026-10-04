/**
 * Progression service — the only code allowed to change XP, GP, Quest Points,
 * or Combat Points. UI components never mutate balances directly.
 *
 * Each call runs in one database transaction:
 *   1. validate the entry against ledger rules;
 *   2. append the ledger transaction (idempotency key → no duplicates);
 *   3. update the cached projection (skill XP / character balances);
 *   4. write activity events (e.g. LEVEL_UP);
 *   5. return a result the UI can turn into feedback.
 * Any failure rolls the whole change back.
 */

import { and, asc, eq, gte, sql } from "drizzle-orm";
import { InsufficientGpError, CharacterNotFoundError } from "@/game/errors";
import {
  assertCanSpendGp,
  projectBalances,
  validateLedgerEntry,
  type Balances,
  type LedgerEntryInput,
  type SourceType,
} from "@/game/ledger";
import type { SkillKey } from "@/game/vocabulary";
import { applyXpGain, type XpGainResult } from "@/game/xp";
import type { Db } from "../db/client";
import {
  activityEvents,
  characterSkills,
  characters,
  progressionTransactions,
  type ProgressionTransactionRow,
} from "../db/schema";

export type ProgressionSource = {
  sourceType: SourceType;
  sourceId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
};

export type ProgressionResult = {
  /** The ledger row (existing row when `duplicate`). Null only when XP was fully capped. */
  transaction: ProgressionTransactionRow | null;
  /** True when the idempotency key had already been used; nothing changed. */
  duplicate: boolean;
  /** Present for XP awards. */
  xp?: XpGainResult;
};

export async function recordProgression(
  db: Db,
  characterId: string,
  entry: LedgerEntryInput,
): Promise<ProgressionResult> {
  validateLedgerEntry(entry);

  return db.transaction(async (tx) => {
    const [character] = await tx
      .select({ id: characters.id, gpBalance: characters.gpBalance })
      .from(characters)
      .where(eq(characters.id, characterId))
      .for("update");
    if (!character) throw new CharacterNotFoundError(characterId);

    if (entry.idempotencyKey) {
      const existing = await findByIdempotencyKey(tx, characterId, entry.idempotencyKey);
      if (existing) return { transaction: existing, duplicate: true };
    }

    let amount = entry.amount;
    let xp: XpGainResult | undefined;
    const metadata = { ...entry.metadata };

    if (entry.kind === "XP") {
      const skillKey = entry.skillKey as SkillKey;
      const [row] = await tx
        .select({ xp: characterSkills.xp })
        .from(characterSkills)
        .where(and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillKey, skillKey)))
        .for("update");
      xp = applyXpGain(row?.xp ?? 0, entry.amount);
      if (xp.appliedXp === 0) return { transaction: null, duplicate: false, xp };
      if (xp.appliedXp !== entry.amount) metadata.requestedXp = entry.amount;
      amount = xp.appliedXp;
    }

    if (entry.kind === "GP" && amount < 0) {
      assertCanSpendGp(character.gpBalance, -amount);
    }

    const inserted = await tx
      .insert(progressionTransactions)
      .values({
        characterId,
        kind: entry.kind,
        amount,
        skillKey: entry.kind === "XP" ? entry.skillKey : null,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId ?? null,
        idempotencyKey: entry.idempotencyKey ?? null,
        metadata,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length === 0) {
      // Lost a race on the idempotency key: someone else already recorded it.
      const existing = await findByIdempotencyKey(tx, characterId, entry.idempotencyKey!);
      return { transaction: existing ?? null, duplicate: true };
    }
    const transaction = inserted[0];

    switch (entry.kind) {
      case "XP": {
        await tx
          .insert(characterSkills)
          .values({ characterId, skillKey: entry.skillKey as SkillKey, xp: xp!.newXp })
          .onConflictDoUpdate({
            target: [characterSkills.characterId, characterSkills.skillKey],
            set: { xp: xp!.newXp },
          });
        if (xp!.leveledUp) {
          await tx.insert(activityEvents).values({
            characterId,
            type: "LEVEL_UP",
            entityId: entry.skillKey as string,
            payload: {
              skillKey: entry.skillKey,
              fromLevel: xp!.previousLevel,
              toLevel: xp!.newLevel,
              transactionId: transaction.id,
            },
          });
        }
        break;
      }
      case "GP": {
        if (amount > 0) {
          await tx
            .update(characters)
            .set({
              gpBalance: sql`${characters.gpBalance} + ${amount}`,
              lifetimeGpEarned: sql`${characters.lifetimeGpEarned} + ${amount}`,
            })
            .where(eq(characters.id, characterId));
        } else {
          const cost = -amount;
          // Guarded update: the row only changes if the balance covers the cost.
          const updated = await tx
            .update(characters)
            .set({
              gpBalance: sql`${characters.gpBalance} - ${cost}`,
              lifetimeGpSpent: sql`${characters.lifetimeGpSpent} + ${cost}`,
            })
            .where(and(eq(characters.id, characterId), gte(characters.gpBalance, cost)))
            .returning({ gpBalance: characters.gpBalance });
          if (updated.length === 0) throw new InsufficientGpError(character.gpBalance, cost);
        }
        break;
      }
      case "QP":
        await tx
          .update(characters)
          .set({ questPoints: sql`${characters.questPoints} + ${amount}` })
          .where(eq(characters.id, characterId));
        break;
      case "COMBAT_POINTS":
        await tx
          .update(characters)
          .set({ combatPoints: sql`${characters.combatPoints} + ${amount}` })
          .where(eq(characters.id, characterId));
        break;
    }

    return { transaction, duplicate: false, xp };
  });
}

async function findByIdempotencyKey(db: Db, characterId: string, key: string) {
  const [row] = await db
    .select()
    .from(progressionTransactions)
    .where(
      and(eq(progressionTransactions.characterId, characterId), eq(progressionTransactions.idempotencyKey, key)),
    );
  return row;
}

// ---------------------------------------------------------------------------
// Convenience API used by game systems
// ---------------------------------------------------------------------------

export function awardXp(db: Db, characterId: string, skillKey: SkillKey, amount: number, source: ProgressionSource) {
  return recordProgression(db, characterId, { kind: "XP", skillKey, amount, ...source });
}

export function awardGp(db: Db, characterId: string, amount: number, source: ProgressionSource) {
  return recordProgression(db, characterId, { kind: "GP", amount, ...source });
}

/** Spend GP. Throws InsufficientGpError (and changes nothing) if the balance is too low. */
export function spendGp(db: Db, characterId: string, cost: number, source: ProgressionSource) {
  assertCanSpendGp(Number.MAX_SAFE_INTEGER, cost); // validates the cost itself
  return recordProgression(db, characterId, { kind: "GP", amount: -cost, ...source });
}

export function awardQuestPoints(db: Db, characterId: string, amount: number, source: ProgressionSource) {
  return recordProgression(db, characterId, { kind: "QP", amount, ...source });
}

export function awardCombatPoints(db: Db, characterId: string, amount: number, source: ProgressionSource) {
  return recordProgression(db, characterId, { kind: "COMBAT_POINTS", amount, ...source });
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

export type ReconciliationReport = {
  consistent: boolean;
  fromLedger: Balances;
  cached: Balances;
};

/** Replay the ledger and compare with cached balances. Read-only. */
export async function reconcileCharacter(db: Db, characterId: string): Promise<ReconciliationReport> {
  const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!character) throw new CharacterNotFoundError(characterId);
  const ledger = await db
    .select()
    .from(progressionTransactions)
    .where(eq(progressionTransactions.characterId, characterId))
    .orderBy(asc(progressionTransactions.seq));
  const fromLedger = projectBalances(
    ledger.map((t) => ({
      kind: t.kind as LedgerEntryInput["kind"],
      amount: t.amount,
      skillKey: t.skillKey as SkillKey | null,
      sourceType: t.sourceType as SourceType,
    })),
  );
  const skillRows = await db.select().from(characterSkills).where(eq(characterSkills.characterId, characterId));
  const cached: Balances = {
    gpBalance: character.gpBalance,
    lifetimeGpEarned: character.lifetimeGpEarned,
    lifetimeGpSpent: character.lifetimeGpSpent,
    questPoints: character.questPoints,
    combatPoints: character.combatPoints,
    skillXp: { ...fromLedger.skillXp, ...Object.fromEntries(skillRows.map((r) => [r.skillKey, r.xp])) },
  };
  return { consistent: JSON.stringify(fromLedger) === JSON.stringify(cached), fromLedger, cached };
}
