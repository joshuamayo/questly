"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Renders a stored UTC timestamp in the viewer's local timezone
 * (CLAUDE.md §38). The server renders a UTC date; the client refines it.
 */
export function LocalDate({
  iso,
  options = { year: "numeric", month: "long", day: "numeric" },
}: {
  iso: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const local = useSyncExternalStore(
    subscribe,
    () => new Date(iso).toLocaleDateString(undefined, options),
    () => new Date(iso).toLocaleDateString("en-US", { ...options, timeZone: "UTC" }),
  );
  return <time dateTime={iso}>{local}</time>;
}
