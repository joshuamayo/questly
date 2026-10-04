import Link from "next/link";
import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { CharacterBust } from "@/components/character/CharacterArt";
import { formatCompact, formatNumber } from "@/lib/format";
import type { CharacterStatus } from "@/server/queries/character-sheet";

function Stat({ icon, value, label, short }: { icon: SpriteName; value: number; label: string; short?: string }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 sm:px-3" title={`${label}: ${formatNumber(value)}`}>
      <PixelIcon name={icon} size={20} />
      <span className="sr-only">
        {label}: {formatNumber(value)}
      </span>
      <span aria-hidden className="text-sm font-bold tabular-nums text-text-primary sm:text-base">
        {short && <span className="mr-1 text-gold-300">{short}</span>}
        {formatCompact(value)}
      </span>
    </span>
  );
}

/**
 * Persistent account status: Total Level · Quest Points · GP, plus the
 * character portrait linking to the profile.
 */
export function StatusBar({ status, bustUrl }: { status: CharacterStatus; bustUrl: string | null }) {
  return (
    <section aria-label="Account status" className="flex items-center gap-2">
      <div className="q-stone q-frame flex h-11 items-center divide-x divide-stone-700">
        <Stat icon="total-level" value={status.totalLevel} label="Total Level" short="LVL" />
        <Stat icon="qp" value={status.questPoints} label="Quest Points" />
        <Stat icon="gp" value={status.gpBalance} label="GP" short="" />
      </div>
      <Link
        href="/character"
        aria-label={`Open character profile for ${status.displayName}`}
        className="q-stone q-frame hidden size-11 items-center justify-center overflow-hidden sm:flex"
      >
        <CharacterBust avatar={status.avatar} name={status.displayName} url={bustUrl} size={36} />
      </Link>
    </section>
  );
}
