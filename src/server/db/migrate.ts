import { MIGRATIONS_DIR, type DatabaseConfig } from "../env";
import type { Db } from "./client";

/** Apply versioned SQL migrations from ./drizzle. Safe to run repeatedly. */
export async function runMigrations(db: Db, config: DatabaseConfig, migrationsFolder = MIGRATIONS_DIR) {
  if (config.driver === "postgres") {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(db as never, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as never, { migrationsFolder });
  }
}
