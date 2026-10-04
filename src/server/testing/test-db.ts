/** Test helper: a fresh, fully migrated in-memory Postgres (PGlite) per call. */

import { openDatabase } from "../db/client";
import { runMigrations } from "../db/migrate";
import { seedContent } from "../seed/content";
import { createCharacter } from "../characters/service";

export async function createTestDb() {
  const config = { driver: "pglite" as const, dataDir: "memory://" };
  const connection = await openDatabase(config);
  await runMigrations(connection.db, config);
  await seedContent(connection.db);
  return connection;
}

export async function createTestCharacter() {
  const connection = await createTestDb();
  const character = await createCharacter(connection.db, { displayName: "Test Adventurer" });
  return { ...connection, character };
}
