"use client";

import { useEffect } from "react";
import { GameButton } from "@/components/ui/GameButton";

/** Route error boundary. Clear about what happened; progress safety stated plainly. */
export default function RealmError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] items-center justify-center p-4">
      <div role="alert" className="q-stone q-frame-gold max-w-lg p-8 text-center">
        <p className="q-display text-xs uppercase tracking-[0.2em] text-crimson-300">Something went wrong</p>
        <h1 className="q-display q-engraved mt-2 text-2xl">This screen could not be loaded</h1>
        <p className="mt-3 text-text-secondary">
          Questly could not read your character data. Your progress was not changed. Try again, and if the problem
          continues, check that the database is running and configured.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-text-muted">Reference: {error.digest}</p>}
        <GameButton variant="primary" className="mt-6" onClick={() => retry()}>
          Try again
        </GameButton>
      </div>
    </div>
  );
}
