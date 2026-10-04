/**
 * Database CLI: `tsx scripts/db.ts <migrate|deploy|seed|seed-demo|reset|reconcile>`.
 * `deploy` (used by the Vercel build) applies migrations only; characters are
 * created on first sign-in.
 * Wrapped by npm scripts (see package.json / README).
 */

import "dotenv/config";
import fs from "node:fs";
import { openDatabase } from "@/server/db/client";
import { runMigrations } from "@/server/db/migrate";
import { getDatabaseConfig } from "@/server/env";
import { seedDemo, seedDevelopmentCharacter } from "@/server/seed/development";
import { reconcileGp } from "@/server/gp/service";

async function main() {
  const command = process.argv[2];
  const config = getDatabaseConfig();
  const where = config.driver === "postgres" ? "Postgres (DATABASE_URL)" : `embedded PGlite at ${config.dataDir}`;

  if (command === "reset") {
    if (config.driver !== "pglite") {
      throw new Error("db:reset only deletes the local embedded database. Refusing to touch DATABASE_URL.");
    }
    fs.rmSync(config.dataDir, { recursive: true, force: true });
    console.log(`Removed ${config.dataDir}`);
  }

  const { db, close } = await openDatabase(config);
  try {
    if (command === "deploy") {
      if (config.driver !== "postgres") {
        console.log("• deploy: DATABASE_URL is not set; skipping database setup.");
      } else {
        await runMigrations(db, config);
        console.log(`✓ Migrations applied — ${where}`);
      }
    }
    if (["migrate", "setup", "reset"].includes(command)) {
      await runMigrations(db, config);
      console.log(`✓ Migrations applied — ${where}`);
    }
    if (["seed", "setup", "reset"].includes(command)) {
      const { character, created } = await seedDevelopmentCharacter(db);
      console.log(`✓ Character "${character.displayName}" ${created ? "created" : "already exists"}`);
    }
    if (command === "seed-demo") {
      const { character } = await seedDevelopmentCharacter(db);
      await seedDemo(db, character.id);
      console.log("✓ Demo quests and rewards added (only into an empty account)");
    }
    if (command === "reconcile") {
      const { character } = await seedDevelopmentCharacter(db);
      const report = await reconcileGp(db, character.id);
      console.log(report.consistent ? "✓ Ledger and balances agree" : "✗ Ledger and balances differ");
      console.log(JSON.stringify(report, null, 2));
      if (!report.consistent) process.exitCode = 1;
    }
    if (!["migrate", "deploy", "seed", "setup", "seed-demo", "reset", "reconcile"].includes(command)) {
      console.error("Usage: tsx scripts/db.ts <migrate|deploy|seed|setup|seed-demo|reset|reconcile>");
      process.exitCode = 1;
    }
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  // Drizzle wraps driver errors ("Failed query: …"); the cause holds the real reason.
  for (let cause = (error as { cause?: unknown })?.cause; cause; cause = (cause as { cause?: unknown }).cause) {
    console.error("Caused by:", cause instanceof Error ? cause.message : cause);
  }
  process.exit(1);
});
