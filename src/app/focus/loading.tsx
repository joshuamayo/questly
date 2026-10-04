/** Focus Mode loading state: minimal, like the encounter itself. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-3xl space-y-4">
      <p className="q-display text-sm uppercase tracking-[0.2em] text-text-muted">Entering Focus Mode…</p>
      <div className="q-stone q-frame h-72 p-5">
        <div className="q-skeleton mx-auto h-6 w-56" />
        <div className="q-skeleton mx-auto mt-6 size-40 rounded-full" />
      </div>
    </div>
  );
}
