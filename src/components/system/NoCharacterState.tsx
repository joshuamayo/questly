import { PixelIcon } from "@/components/icons/PixelIcon";

/** Shown when the database is reachable but no character has been created. */
export function NoCharacterState() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="q-parchment q-frame-gold max-w-lg p-8 text-center">
        <PixelIcon name="character" size={48} className="mx-auto" />
        <h1 className="q-display mt-3 text-2xl">No Character Yet</h1>
        <p className="mt-2 text-parchment-ink-soft">
          The realm is ready, but no adventurer has been created. Run the seed command to create your character, then
          reload.
        </p>
        <pre className="mt-4 rounded-xs bg-parchment-200 px-3 py-2 font-mono text-sm text-parchment-ink">npm run db:setup</pre>
      </div>
    </div>
  );
}
