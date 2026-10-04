import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, isEmailAllowed, safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";

/** Landing point for the emailed sign-in link: trade the code for a session. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNextPath(url.searchParams.get("next"));
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin));

  const config = getAuthConfig();
  if (!config.enabled) return NextResponse.redirect(new URL("/", url.origin));
  const code = url.searchParams.get("code");
  if (!code) return fail("link");

  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail("link");
  if (!isEmailAllowed(data.user.email, config.allowedEmails)) {
    await supabase.auth.signOut();
    return fail("not-allowed");
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
