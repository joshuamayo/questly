/**
 * Environment configuration. All env access goes through here.
 *
 * DATABASE_URL       Postgres connection string (e.g. Supabase). When unset,
 *                    Questly uses an embedded PGlite database on disk.
 * QUESTLY_PGLITE_DIR Data directory for the embedded database
 *                    (default: ./.data/pglite).
 */

import path from "node:path";

export type DatabaseConfig =
  | { driver: "postgres"; url: string }
  | { driver: "pglite"; dataDir: string };

export function getDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const url = env.DATABASE_URL?.trim();
  if (url) return { driver: "postgres", url };
  const dataDir = env.QUESTLY_PGLITE_DIR?.trim() || path.join(process.cwd(), ".data", "pglite");
  return { driver: "pglite", dataDir };
}

export const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");
