"use client";

import { useSyncExternalStore } from "react";
import { greetingFor } from "@/game/character";

const subscribe = () => () => {};

/** "Good morning, Joshua." — uses the viewer's local time; neutral on the server. */
export function Greeting({ name }: { name: string }) {
  const greeting = useSyncExternalStore(
    subscribe,
    () => greetingFor(new Date().getHours()),
    () => "Welcome back",
  );
  return (
    <>
      {greeting}, {name}.
    </>
  );
}
