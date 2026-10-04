"use client";

import "./globals.css";

/** Last-resort boundary for failures in the root layout itself. */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center p-6">
        <div role="alert" className="q-stone q-frame-gold max-w-md p-8 text-center">
          <h1 className="q-display q-engraved text-2xl">Questly failed to start</h1>
          <p className="mt-3 text-text-secondary">Your progress was not changed. Reload to try again.</p>
          <button type="button" onClick={() => retry()} className="q-display mt-6 border-2 border-gold-600 px-5 py-2 text-gold-200">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
