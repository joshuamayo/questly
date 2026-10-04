import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { GameLinkButton } from "@/components/ui/GameButton";
import { LockState } from "@/components/ui/LockedState";
import { PageBanner } from "@/components/art/PageBanner";

/**
 * Intentional placeholder for a system that is designed but not built yet.
 * It establishes the route and the system's identity, states plainly that it
 * is not implemented, and offers no fake controls.
 */
export function SystemPlaceholder({
  title,
  icon,
  tagline,
  description,
  features,
  slot,
}: {
  slot: string;
  title: string;
  icon: SpriteName;
  tagline: string;
  description: string;
  features: string[];
}) {
  return (
    <>
      <PageBanner slot={slot} title={title} tagline={tagline} />
      <div className="mx-auto max-w-5xl">
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,15rem)_1fr]">
        {/* Sealed gate medallion */}
        <div className="q-stone q-frame flex flex-col items-center gap-4 px-6 py-8">
          <div className="relative">
            <div className="q-well flex size-32 items-center justify-center rounded-full border-4 border-stone-700 shadow-[0_0_0_2px_var(--color-border-dark),inset_0_0_24px_rgb(0_0_0/0.8)]">
              <PixelIcon name={icon} size={72} className="opacity-50 grayscale-[0.6]" />
            </div>
            <span className="q-well absolute -bottom-2 left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border-2 border-gold-700">
              <PixelIcon name="lock" size={22} />
            </span>
          </div>
          <LockState locked lockedLabel="Not yet built" />
        </div>

        <div className="q-parchment q-frame p-6 sm:p-8">
          <h2 className="q-title text-3xl text-parchment-ink">This part of the realm is still being built</h2>
          <p className="mt-3 max-w-prose text-parchment-ink">{description}</p>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-parchment-ink-soft">
            When it opens, you will be able to
          </p>
          <ul className="mt-2 space-y-1.5">
            {features.map((f) => (
              <li key={f} className="flex gap-2 text-parchment-ink">
                <span aria-hidden className="text-gold-600">◆</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-parchment-400/60 pt-4 text-sm text-parchment-ink-soft">
            Nothing here is functional yet, and no progress is tracked for it. Your character, Skills, and balances are
            safe and unaffected.
          </p>
          <GameLinkButton href="/" variant="secondary" size="sm" className="mt-5">
            Return to World
          </GameLinkButton>
        </div>
      </div>
      </div>
    </>
  );
}
