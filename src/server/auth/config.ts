/**
 * Sign-in configuration (Supabase Auth, email sign-in links).
 *
 * SUPABASE_URL            Project URL (Supabase → Project Settings → API).
 * SUPABASE_ANON_KEY       Public "anon" / publishable key. Only used on the server.
 * QUESTLY_ALLOWED_EMAILS  Comma-separated emails allowed to sign in. Required:
 *                         an empty list lets nobody in.
 * QUESTLY_ALLOW_NO_AUTH   Set to "1" to run a production build without sign-in
 *                         (local testing only — never on a public URL).
 *
 * Without SUPABASE_URL/KEY, Questly runs in single-player local mode: no
 * sign-in, the first character is used. Production refuses that mode unless
 * QUESTLY_ALLOW_NO_AUTH=1, so a misconfigured deploy fails closed.
 */

export type AuthConfig =
  | { enabled: true; url: string; key: string; allowedEmails: string[] }
  | { enabled: false };

export function getAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const url = env.SUPABASE_URL?.trim();
  const key = (env.SUPABASE_ANON_KEY ?? env.SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key) return { enabled: false };
  const allowedEmails = (env.QUESTLY_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return { enabled: true, url, key, allowedEmails };
}

export function isEmailAllowed(email: string | null | undefined, allowed: readonly string[]): boolean {
  return Boolean(email) && allowed.includes(email!.trim().toLowerCase());
}

export class UnsafeDeploymentError extends Error {
  constructor() {
    super(
      "Questly is running in production without sign-in. Set SUPABASE_URL, SUPABASE_ANON_KEY, and QUESTLY_ALLOWED_EMAILS " +
        "(or QUESTLY_ALLOW_NO_AUTH=1 for local testing only).",
    );
    this.name = "UnsafeDeploymentError";
  }
}

/** Fail closed: a production server never serves an account without sign-in by accident. */
export function assertNoAuthModeAllowed(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === "production" && env.QUESTLY_ALLOW_NO_AUTH !== "1") throw new UnsafeDeploymentError();
}

/** Only same-site relative paths are valid post-login destinations. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
