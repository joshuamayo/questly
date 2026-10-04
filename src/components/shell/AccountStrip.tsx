import Link from "next/link";
import { AvatarSprite } from "@/components/character/AvatarSprite";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import type { CharacterStatus } from "@/server/queries";
import { MobileMenu } from "./MobileMenu";
import { Wordmark } from "./Wordmark";

/**
 * Persistent account strip: Total Level, Quest Points, GP, and the character
 * menu. On small screens it also carries the wordmark and menu button.
 */
export function AccountStrip({ status }: { status: CharacterStatus }) {
  return (
    <header className="q-timber sticky top-0 z-30 overflow-x-clip border-b-2 border-border-dark shadow-[inset_0_-1px_0_rgb(217_164_65/0.25),0_6px_16px_rgb(0_0_0/0.4)]">
      <div className="flex min-h-14 items-center gap-3 px-3 sm:px-5">
        <div className="flex items-center gap-2 lg:hidden">
          <MobileMenu status={status} />
          <span className="hidden sm:block">
            <Wordmark compact />
          </span>
        </div>
        <p className="hidden text-sm text-text-muted lg:block">
          <span className="text-text-secondary">{status.displayName}</span>
          {status.title && <span className="text-gold-300"> the {status.title.name}</span>}
        </p>
        <section aria-label="Account status" className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <CurrencyDisplay kind="TOTAL_LEVEL" value={status.totalLevel} max={status.maxTotalLevel} variant="chip" />
          <CurrencyDisplay kind="QP" value={status.questPoints} variant="chip" compact />
          <CurrencyDisplay kind="GP" value={status.gpBalance} variant="chip" compact />
          <Link
            href="/character"
            className="ml-1 hidden size-10 items-end justify-center overflow-hidden rounded-xs border border-gold-700 bg-stone-850 sm:flex"
            aria-label={`Open character profile for ${status.displayName}`}
          >
            <AvatarSprite avatar={status.avatar} name={status.displayName} height={36} />
          </Link>
        </section>
      </div>
    </header>
  );
}
