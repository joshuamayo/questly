import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, isEmailAllowed } from "@/server/auth/config";

const PUBLIC_PATHS = ["/login", "/auth/"];

/**
 * Sign-in gate. Refreshes the Supabase session cookie on every request and
 * sends anyone who isn't the allow-listed player to /login. In local mode
 * (no Supabase configured) it does nothing.
 */
export async function proxy(request: NextRequest) {
  const config = getAuthConfig();
  if (!config.enabled) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const allowed = isEmailAllowed(data.user?.email, config.allowedEmails);
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));

  if (!allowed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = path === "/" ? "" : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    const redirect = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  }
  if (allowed && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|art/|icon.svg|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?)$).*)"],
};
