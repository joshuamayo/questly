import Link from "next/link";
import { CharacterBust } from "@/components/character/CharacterArt";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { formatNumber } from "@/lib/format";
import type { Profile } from "@/server/loaders";
import { Wordmark } from "./Wordmark";

/** Compact top bar below the desktop breakpoint: wordmark, GP, and profile. */
export function MobileTopBar({ profile, bustUrl }: { profile: Profile; bustUrl: string | null }) {
  return (
    <header className="q-rail sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-border-dark px-3 shadow-[inset_0_-1px_0_var(--color-bronze),0_6px_16px_rgb(0_0_0/0.45)] sm:px-5 lg:hidden">
      <Wordmark compact />
      <Link
        href="/reward-shop"
        className="q-well ml-auto flex items-center gap-1.5 border border-border-dark px-2.5 py-1.5 font-bold tabular-nums text-gold-200"
        aria-label={`${formatNumber(profile.gpBalance)} GP. Open the Reward Shop.`}
      >
        <PixelIcon name="gp" size={18} /> {formatNumber(profile.gpBalance)} GP
      </Link>
      <Link href="/settings" aria-label="Profile settings" className="q-well flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-gold-600">
        <CharacterBust avatar={profile.avatar} name={profile.displayName} url={bustUrl} size={36} />
      </Link>
    </header>
  );
}
