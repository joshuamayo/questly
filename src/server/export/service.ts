/**
 * Account export: every record that belongs to the character, as plain JSON,
 * so years of history are never trapped in the app.
 */

import { asc, eq } from "drizzle-orm";
import { CharacterNotFoundError } from "@/game/errors";
import type { Db } from "../db/client";
import { characters, gpTransactions, quests, rewardRedemptions, rewards } from "../db/schema";

export const EXPORT_FORMAT = "questly-export";
export const EXPORT_VERSION = 2;

export async function exportCharacter(db: Db, characterId: string, now: Date = new Date()) {
  const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!character) throw new CharacterNotFoundError(characterId);
  const { authSubject: _auth, ...profile } = character;
  void _auth;
  const [questRows, ledger, rewardRows, redemptions] = await Promise.all([
    db.select().from(quests).where(eq(quests.characterId, characterId)).orderBy(asc(quests.status), asc(quests.position), asc(quests.createdAt)),
    db.select().from(gpTransactions).where(eq(gpTransactions.characterId, characterId)).orderBy(asc(gpTransactions.seq)),
    db.select().from(rewards).where(eq(rewards.characterId, characterId)).orderBy(asc(rewards.createdAt)),
    db.select().from(rewardRedemptions).where(eq(rewardRedemptions.characterId, characterId)).orderBy(asc(rewardRedemptions.redeemedAt)),
  ]);
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    character: profile,
    questLog: questRows.filter((q) => q.status === "active"),
    completed: questRows.filter((q) => q.status === "completed").sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime()),
    archived: questRows.filter((q) => q.status === "archived"),
    gpTransactions: ledger,
    rewards: rewardRows,
    redemptions,
  };
}
