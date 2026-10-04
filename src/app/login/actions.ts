"use server";

import { headers } from "next/headers";
import { getAuthConfig, isEmailAllowed, safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function siteOrigin() {
  const fromEnv = process.env.QUESTLY_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Email a sign-in link. The reply is identical whether or not the address is
 * allowed, so the form never reveals who can sign in.
 */
export async function sendSignInLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const config = getAuthConfig();
  if (!config.enabled) return { status: "error", message: "Sign-in is not configured on this server." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { status: "error", message: "Enter a valid email address." };
  const sent: LoginState = { status: "sent", message: `If ${email} may enter, a sign-in link is on its way. Open it on this device.` };
  if (!isEmailAllowed(email, config.allowedEmails)) return sent;

  const next = safeNextPath(String(form.get("next") ?? "/"));
  const supabase = (await createSupabaseServerClient())!;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: true },
  });
  if (error) {
    console.error("Sign-in link failed", error.message);
    return {
      status: "error",
      message: error.status === 429 ? "Too many sign-in emails. Wait a minute and try again." : "The sign-in link could not be sent. Try again.",
    };
  }
  return sent;
}
