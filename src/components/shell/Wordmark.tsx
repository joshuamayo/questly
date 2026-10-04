import Link from "next/link";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { cx } from "@/lib/cx";

/** Questly wordmark: sword emblem + engraved display type. */
export function Wordmark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cx("group inline-flex items-center gap-2", className)} aria-label="Questly — return to World">
      <span className="q-well flex size-9 items-center justify-center border border-gold-700">
        <PixelIcon name="sword" size={24} />
      </span>
      <span className="leading-none">
        <span className={cx("q-display q-engraved block tracking-[0.2em]", compact ? "text-lg" : "text-2xl")}>
          QUESTLY
        </span>
        {!compact && (
          <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.22em] text-text-muted">
            Real Progress · Epic Rewards
          </span>
        )}
      </span>
    </Link>
  );
}
