"use client";

import { useSyncExternalStore } from "react";
import { localToday } from "./dates";

const subscribe = () => () => {};

/** The viewer's local date (YYYY-MM-DD); null during server render. */
export function useLocalToday(): string | null {
  return useSyncExternalStore(subscribe, () => localToday(), () => null);
}
