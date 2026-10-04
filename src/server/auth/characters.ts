/**
 * Links a signed-in account to its character. The first sign-in claims an
 * existing unlinked character (e.g. the one created by setup) or creates a
 * new one; later sign-ins always resolve to the same character.
 */

import { asc, eq, isNull } from "drizzle-orm";
import type { Db } from "../db/client";
import { characters } from "../db/schema";
import { createCharacter } from "../characters/service";

export type SignedInUser = { id: string; email: string };

function nameFromEmail(email: string): string {
  const local = email.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\d+/g, "").trim() || "Adventurer";
  return local.charAt(0).toUpperCase() + local.slice(1, 40);
}

export async function characterForUser(db: Db, user: SignedInUser): Promise<string> {
  const [mine] = await db.select({ id: characters.id }).from(characters).where(eq(characters.authSubject, user.id));
  if (mine) return mine.id;

  const [unclaimed] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(isNull(characters.authSubject))
    .orderBy(asc(characters.createdAt))
    .limit(1);
  if (unclaimed) {
    const claimed = await db
      .update(characters)
      .set({ authSubject: user.id })
      .where(eq(characters.id, unclaimed.id))
      .returning({ id: characters.id });
    if (claimed.length) return claimed[0].id;
  }

  try {
    return (await createCharacter(db, { displayName: nameFromEmail(user.email), authSubject: user.id })).id;
  } catch (error) {
    // A concurrent first request may have created it (auth_subject is unique).
    const [again] = await db.select({ id: characters.id }).from(characters).where(eq(characters.authSubject, user.id));
    if (again) return again.id;
    throw error;
  }
}
