import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { GameRuleError } from "@/game/errors";
import type { Db } from "../db/client";
import { firstCharacterId } from "../queries";
import { characterForUser, type SignedInUser } from "./characters";
import { assertNoAuthModeAllowed, getAuthConfig, isEmailAllowed } from "./config";

export class NotSignedInError extends GameRuleError {
  constructor() {
    super("Your session has ended. Sign in again to continue — your progress is safe.", "NOT_SIGNED_IN");
  }
}

/** Supabase client bound to the request cookies (Server Components, actions, route handlers). */
export async function createSupabaseServerClient() {
  const config = getAuthConfig();
  if (!config.enabled) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in, allow-listed user, or null. */
export async function getSignedInUser(): Promise<SignedInUser | null> {
  const config = getAuthConfig();
  if (!config.enabled) return null;
  const supabase = (await createSupabaseServerClient())!;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email || !isEmailAllowed(user.email, config.allowedEmails)) return null;
  return { id: user.id, email: user.email };
}

/**
 * The character every query and action works on. With sign-in enabled it is
 * the signed-in player's own character; in local mode, the first character.
 */
export async function resolveCurrentCharacterId(db: Db): Promise<string> {
  if (!getAuthConfig().enabled) {
    assertNoAuthModeAllowed();
    return firstCharacterId(db);
  }
  const user = await getSignedInUser();
  if (!user) throw new NotSignedInError();
  return characterForUser(db, user);
}
