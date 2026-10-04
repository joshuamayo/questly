import Link from "next/link";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { cx } from "@/lib/cx";

/** Questly wordmark: emblem + engraved display type. */
export function Wordmark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cx("group inline-flex items-center gap-2.5", className)} aria-label="Questly — go to your Quest Log">
      <span className="flex size-11 items-center justify-center">
        <span className="q-well flex size-10 rotate-45 items-center justify-center border border-gold-600">
          <PixelIcon name="sword" size={24} className="-rotate-45" />
        </span>
      </span>
      <span className="leading-none">
        <span className={cx("q-display q-engraved block tracking-[0.14em]", compact ? "text-lg" : "text-[1.55rem]")}>
          QUESTLY
        </span>
        {!compact && (
          <span className="mt-1 block text-[0.68rem] font-bold uppercase leading-snug tracking-[0.16em] text-text-secondary">
            Turn real progress
            <br />
            into epic rewards
          </span>
        )}
      </span>
    </Link>
  );
}
