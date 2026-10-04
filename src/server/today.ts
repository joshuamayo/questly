import "server-only";
import { cookies } from "next/headers";
import { trustedLocalDate } from "./requirements/service";

export const TIMEZONE_COOKIE = "questly-tz";

/** The calendar date in an IANA timezone, or null if the zone is unknown. */
export function dateInZone(timeZone: string | undefined, now: Date = new Date()): string | null {
  if (!timeZone) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return null;
  }
}

/**
 * The viewer's local calendar date, from the timezone the browser reported
 * (cookie). Falls back to UTC, and never strays more than a day from it.
 */
export async function viewerToday(now: Date = new Date()): Promise<string> {
  const tz = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  return trustedLocalDate(dateInZone(tz ? decodeURIComponent(tz) : undefined, now), now);
}

/** The date for a mutation: the client's local date if plausible, else the viewer's zone. */
export async function actionToday(localDate?: string | null): Promise<string> {
  return localDate ? trustedLocalDate(localDate) : viewerToday();
}
