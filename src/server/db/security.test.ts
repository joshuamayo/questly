import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "../testing/test-db";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
beforeEach(async () => {
  ctx = await createTestDb();
});
afterEach(async () => {
  await ctx.close();
});

describe("Database security", () => {
  it("every public table has Row Level Security enabled (Supabase Data API stays locked)", async () => {
    const rows = await ctx.db.execute<{ relname: string; relrowsecurity: boolean }>(sql`
      select c.relname, c.relrowsecurity
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    `);
    const list = (Array.isArray(rows) ? rows : (rows as unknown as { rows: { relname: string; relrowsecurity: boolean }[] }).rows) as {
      relname: string;
      relrowsecurity: boolean;
    }[];
    expect(list.map((r) => r.relname).sort()).toEqual(["characters", "gp_transactions", "quests", "reward_redemptions", "rewards"]);
    expect(list.filter((r) => !r.relrowsecurity).map((r) => r.relname)).toEqual([]);
  });
});
