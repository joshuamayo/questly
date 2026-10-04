"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const COOKIE = "questly-tz";

/**
 * Tells the server the browser's timezone so dates such as "today", streaks,
 * and Diary weeks match the player's local calendar. Refreshes once if the
 * zone was unknown or has changed (e.g. travel).
 */
export function TimezoneSync() {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const current = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    if (current && decodeURIComponent(current) === tz) return;
    document.cookie = `${COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);
  return null;
}
