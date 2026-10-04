/**
 * Database client. One lazily created connection per process.
 *
 * Production / Supabase: set DATABASE_URL → postgres.js driver.
 * Local development without credentials: embedded PGlite (real Postgres
 * compiled to WASM) persisted to disk, using the same schema and migrations.
 */

import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getDatabaseConfig, type DatabaseConfig } from "../env";
import * as schema from "./schema";

export type Schema = typeof schema;
/** Any Drizzle Postgres database or transaction bound to the Questly schema. */
export type Db = PgDatabase<PgQueryResultHKT, Schema>;

type Connection = { db: Db; close: () => Promise<void>; config: DatabaseConfig };

const globalForDb = globalThis as unknown as { __questlyDb?: Promise<Connection> };

export async function openDatabase(config: DatabaseConfig = getDatabaseConfig()): Promise<Connection> {
  if (config.driver === "postgres") {
    const [{ default: postgres }, { drizzle }] = await Promise.all([
      import("postgres"),
      import("drizzle-orm/postgres-js"),
    ]);
    // `prepare: false` keeps compatibility with Supabase's poolers. Use the
    // *session* pooler (port 5432): the transaction pooler can drop replies
    // when many queries are pipelined on one connection. Idle connections are
    // released quickly so serverless instances stay within the pool limit.
    const client = postgres(config.url, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 15 });
    return { db: drizzle(client, { schema }) as unknown as Db, close: () => client.end(), config };
  }
  const [{ PGlite }, { drizzle }, fs] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("node:fs"),
  ]);
  if (!config.dataDir.startsWith("memory://")) fs.mkdirSync(config.dataDir, { recursive: true });
  const client = new PGlite(config.dataDir);
  return { db: drizzle(client, { schema }) as unknown as Db, close: () => client.close(), config };
}

/** Shared app connection (cached across hot reloads in development). */
export async function getDb(): Promise<Db> {
  globalForDb.__questlyDb ??= openDatabase().catch((error) => {
    globalForDb.__questlyDb = undefined;
    throw error;
  });
  return (await globalForDb.__questlyDb).db;
}
