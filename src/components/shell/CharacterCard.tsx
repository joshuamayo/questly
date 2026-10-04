import Link from "next/link";
import { CharacterBust } from "@/components/character/CharacterArt";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { formatNumber } from "@/lib/format";
import type { Profile } from "@/server/loaders";

/** Rail footer: portrait, name, and GP balance. Opens profile settings. */
export function CharacterCard({ profile, bustUrl }: { profile: Profile; bustUrl: string | null }) {
  return (
    <Link
      href="/settings"
      className="q-stone q-frame flex items-center gap-3 p-3 hover:[box-shadow:inset_0_0_0_1px_var(--color-gold-500),var(--shadow-panel)]"
      aria-label={`${profile.displayName}, ${formatNumber(profile.gpBalance)} GP. Open profile settings.`}
    >
      <span className="q-well flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold-600">
        <CharacterBust avatar={profile.avatar} name={profile.displayName} url={bustUrl} size={52} />
      </span>
      <span className="min-w-0">
        <span className="q-title block truncate text-lg leading-tight text-text-primary">{profile.displayName}</span>
        <span className="flex items-center gap-1.5 font-bold tabular-nums text-gold-200">
          <PixelIcon name="gp" size={18} /> {formatNumber(profile.gpBalance)} GP
        </span>
      </span>
    </Link>
  );
}
