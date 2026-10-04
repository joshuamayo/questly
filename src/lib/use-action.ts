"use client";

import { useState, useTransition } from "react";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Runs a server action in a transition and tracks its error message. */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run<T>(fn: () => Promise<Result<T>>, onOk?: (data: T) => void) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) onOk?.(r.data);
      else setError(r.error);
    });
  }
  return { pending, error, setError, run };
}
