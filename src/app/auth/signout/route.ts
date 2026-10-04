import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/server/auth/session";

/** Sign out (POST only, so links and prefetching can't sign you out). */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/login?signedOut=1", request.nextUrl.origin), { status: 303 });
}
