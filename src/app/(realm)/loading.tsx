/** Themed, instant loading state (no artificial delay). */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl space-y-4">
      <p className="q-display text-sm uppercase tracking-[0.2em] text-text-muted">Opening Quest Log…</p>
      <div className="q-stone q-frame h-48 p-5">
        <div className="q-skeleton h-6 w-48" />
        <div className="q-skeleton mt-4 h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="q-parchment q-frame h-40 p-5">
          <div className="h-5 w-40 rounded-xs bg-parchment-300/60" />
          <div className="mt-3 h-4 w-60 rounded-xs bg-parchment-300/50" />
        </div>
        <div className="q-stone q-frame h-40 p-5">
          <div className="q-skeleton h-5 w-40" />
        </div>
      </div>
    </div>
  );
}
