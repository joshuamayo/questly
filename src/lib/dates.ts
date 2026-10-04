/** Format a date-only value (YYYY-MM-DD) identically on server and client. */
export function formatIsoDate(isoDate: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

/** The viewer's local calendar date as YYYY-MM-DD. Client-only. */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
