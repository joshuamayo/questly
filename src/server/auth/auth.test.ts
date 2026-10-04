import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { characters } from "../db/schema";
import { createTestDb } from "../testing/test-db";
import { createCharacter } from "../characters/service";
import { characterForUser } from "./characters";
import { assertNoAuthModeAllowed, getAuthConfig, isEmailAllowed, safeNextPath } from "./config";

describe("Auth configuration", () => {
  it("is disabled without Supabase settings and parses the allow-list", () => {
    expect(getAuthConfig({} as NodeJS.ProcessEnv)).toEqual({ enabled: false });
    expect(getAuthConfig({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "k", QUESTLY_ALLOWED_EMAILS: " Me@Example.com, ,b@c.d" } as unknown as NodeJS.ProcessEnv)).toEqual({
      enabled: true,
      url: "https://x.supabase.co",
      key: "k",
      allowedEmails: ["me@example.com", "b@c.d"],
    });
  });

  it("only allows listed emails; an empty list allows nobody", () => {
    expect(isEmailAllowed("ME@example.com", ["me@example.com"])).toBe(true);
    expect(isEmailAllowed("other@example.com", ["me@example.com"])).toBe(false);
    expect(isEmailAllowed("me@example.com", [])).toBe(false);
    expect(isEmailAllowed(null, ["me@example.com"])).toBe(false);
  });

  it("refuses no-sign-in mode in production unless explicitly allowed", () => {
    expect(() => assertNoAuthModeAllowed({ NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toThrow(/without sign-in/);
    expect(() => assertNoAuthModeAllowed({ NODE_ENV: "production", QUESTLY_ALLOW_NO_AUTH: "1" } as unknown as NodeJS.ProcessEnv)).not.toThrow();
    expect(() => assertNoAuthModeAllowed({ NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv)).not.toThrow();
  });

  it("only redirects to same-site paths after sign-in", () => {
    expect(safeNextPath("/quests?view=completed")).toBe("/quests?view=completed");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});

describe("Account → character", () => {
  let ctx: Awaited<ReturnType<typeof createTestDb>>;
  beforeEach(async () => {
    ctx = await createTestDb();
  });
  afterEach(async () => {
    await ctx.close();
  });

  it("creates a character on first sign-in and returns the same one afterwards", async () => {
    const id = await characterForUser(ctx.db, { id: "user-1", email: "joshua.mayo@example.com" });
    expect(await characterForUser(ctx.db, { id: "user-1", email: "joshua.mayo@example.com" })).toBe(id);
    const [c] = await ctx.db.select().from(characters).where(eq(characters.id, id));
    expect(c).toMatchObject({ authSubject: "user-1", displayName: "Joshua mayo" });
  });

  it("claims an existing unlinked character instead of creating a second one", async () => {
    const existing = await createCharacter(ctx.db, { displayName: "Joshua" });
    expect(await characterForUser(ctx.db, { id: "user-1", email: "j@example.com" })).toBe(existing.id);
    const other = await characterForUser(ctx.db, { id: "user-2", email: "k@example.com" });
    expect(other).not.toBe(existing.id);
    expect(await ctx.db.select().from(characters)).toHaveLength(2);
  });
});
