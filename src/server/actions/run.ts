import "server-only";
import { revalidatePath } from "next/cache";
import { GameRuleError } from "@/game/errors";
import { getDb, type Db } from "../db/client";
import { resolveCurrentCharacterId } from "../auth/session";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Runs a mutation for the current character. Rule violations return their
 * player-facing message; unexpected failures say plainly that nothing changed
 * (services run in transactions, so that is true).
 */
export async function runAction<T>(fn: (db: Db, characterId: string) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const db = await getDb();
    const characterId = await resolveCurrentCharacterId(db);
    const data = await fn(db, characterId);
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof GameRuleError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Something went wrong. Nothing was changed. Try again." };
  }
}
