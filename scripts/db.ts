/**
 * Database CLI: `tsx scripts/db.ts <migrate|deploy|seed|seed-demo|reset|reconcile>`.
 * `deploy` (used by the Vercel build) applies migrations and seed content only;
 * characters are created on first sign-in.
 * Wrapped by npm scripts (see package.json / README).
 */

import "dotenv/config";
import fs from "node:fs";
import { openDatabase } from "@/server/db/client";
import { runMigrations } from "@/server/db/migrate";
import { getDatabaseConfig } from "@/server/env";
import { seedContent } from "@/server/seed/content";
import { seedDemoProgression, seedDevelopmentCharacter } from "@/server/seed/development";
import { reconcileCharacter } from "@/server/progression/service";
import { syncProgression } from "@/server/meta/sync";
import { backfillActivityDays } from "@/server/streaks/service";
import { minimumQualifyingMinutes } from "@/game/focus";

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
        await seedContent(db);
        console.log(`✓ Migrations applied and content seeded — ${where}`);
      }
    }
    if (["migrate", "setup", "reset"].includes(command)) {
      await runMigrations(db, config);
      console.log(`✓ Migrations applied — ${where}`);
    }
    if (["seed", "setup", "reset"].includes(command)) {
      await seedContent(db);
      const { character, created } = await seedDevelopmentCharacter(db);
      console.log(`✓ Content seeded; character "${character.displayName}" ${created ? "created" : "already exists"}`);
      const unlocks = await syncProgression(db, character.id);
      const n = unlocks.achievements.length + unlocks.collection.length + unlocks.titles.length;
      if (n) console.log(`✓ Progression synced: ${n} newly earned (achievements, collection, titles)`);
      await backfillActivityDays(db, character.id, minimumQualifyingMinutes());
    }
    if (command === "seed-demo") {
      await seedContent(db);
      const { character } = await seedDevelopmentCharacter(db);
      const { applied, total } = await seedDemoProgression(db, character.id);
      console.log(`✓ Demo progression: ${applied} new of ${total} entries (SEED_DEMO)`);
    }
    if (command === "reconcile") {
      const { character } = await seedDevelopmentCharacter(db);
      const report = await reconcileCharacter(db, character.id);
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
  process.exit(1);
});
