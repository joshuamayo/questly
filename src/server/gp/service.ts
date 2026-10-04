/**
 * GP ledger — the only code that changes a character's GP. Every change is an
 * append-only `gp_transactions` row plus a guarded update of the cached
 * balance, in one transaction. Idempotency keys make retries safe.
 */

import { and, asc, eq, gte, sql } from "drizzle-orm";
import { CharacterNotFoundError, InsufficientGpError } from "@/game/errors";
import { assertPositiveWhole, projectGp, type GpSourceType } from "@/game/gp";
import type { Db } from "../db/client";
import { characters, gpTransactions, type GpTransactionRow } from "../db/schema";

export type GpEntry = {
  sourceType: GpSourceType;
  sourceId?: string | null;
  description: string;
  idempotencyKey: string;
};

export type GpResult = { duplicate: boolean; transaction: GpTransactionRow; gpBalance: number };

async function existing(db: Db, characterId: string, key: string) {
  const [row] = await db
    .select()
    .from(gpTransactions)
    .where(and(eq(gpTransactions.characterId, characterId), eq(gpTransactions.idempotencyKey, key)));
  return row ?? null;
}

async function balanceOf(db: Db, characterId: string) {
  const [c] = await db.select({ gp: characters.gpBalance }).from(characters).where(eq(characters.id, characterId));
  if (!c) throw new CharacterNotFoundError(characterId);
  return c.gp;
}

/** Award GP. Re-using an idempotency key returns the original transaction and changes nothing. */
export async function earnGp(db: Db, characterId: string, amount: number, entry: GpEntry): Promise<GpResult> {
  assertPositiveWhole(amount);
  return db.transaction(async (tx) => {
    const prior = await existing(tx, characterId, entry.idempotencyKey);
    if (prior) return { duplicate: true, transaction: prior, gpBalance: await balanceOf(tx, characterId) };
    const [transaction] = await tx
      .insert(gpTransactions)
      .values({ characterId, amount, transactionType: "EARN", ...entry })
      .returning();
    const [c] = await tx
      .update(characters)
      .set({ gpBalance: sql`${characters.gpBalance} + ${amount}`, lifetimeGpEarned: sql`${characters.lifetimeGpEarned} + ${amount}` })
      .where(eq(characters.id, characterId))
      .returning({ gp: characters.gpBalance });
    if (!c) throw new CharacterNotFoundError(characterId);
    return { duplicate: false, transaction, gpBalance: c.gp };
  });
}

/** Spend GP. Throws InsufficientGpError (changing nothing) if the balance can't cover it. */
export async function spendGp(db: Db, characterId: string, cost: number, entry: GpEntry): Promise<GpResult> {
  assertPositiveWhole(cost, "The cost");
  return db.transaction(async (tx) => {
    const prior = await existing(tx, characterId, entry.idempotencyKey);
    if (prior) return { duplicate: true, transaction: prior, gpBalance: await balanceOf(tx, characterId) };
    // Guarded update: only changes the row if the balance covers the cost.
    const [c] = await tx
      .update(characters)
      .set({ gpBalance: sql`${characters.gpBalance} - ${cost}`, lifetimeGpSpent: sql`${characters.lifetimeGpSpent} + ${cost}` })
      .where(and(eq(characters.id, characterId), gte(characters.gpBalance, cost)))
      .returning({ gp: characters.gpBalance });
    if (!c) throw new InsufficientGpError(await balanceOf(tx, characterId), cost);
    const [transaction] = await tx
      .insert(gpTransactions)
      .values({ characterId, amount: -cost, transactionType: "SPEND", ...entry })
      .returning();
    return { duplicate: false, transaction, gpBalance: c.gp };
  });
}

/** Replay the ledger and compare with the cached balance. Read-only. */
export async function reconcileGp(db: Db, characterId: string) {
  const [c] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!c) throw new CharacterNotFoundError(characterId);
  const rows = await db.select({ amount: gpTransactions.amount }).from(gpTransactions).where(eq(gpTransactions.characterId, characterId)).orderBy(asc(gpTransactions.seq));
  const fromLedger = projectGp(rows.map((r) => r.amount));
  const cached = { gpBalance: c.gpBalance, lifetimeGpEarned: c.lifetimeGpEarned, lifetimeGpSpent: c.lifetimeGpSpent };
  return { consistent: JSON.stringify(fromLedger) === JSON.stringify(cached), fromLedger, cached };
}
