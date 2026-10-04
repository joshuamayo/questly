import type { ReactNode } from "react";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { cx } from "@/lib/cx";

/**
 * Locked / unlocked marker. Pairs an icon with text so state is never
 * conveyed by color or dimming alone.
 */
export function LockState({
  locked,
  lockedLabel = "Locked",
  unlockedLabel = "Unlocked",
  className,
}: {
  locked: boolean;
  lockedLabel?: string;
  unlockedLabel?: string;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em]",
        locked ? "text-text-muted" : "text-moss-300",
        className,
      )}
    >
      {locked ? <PixelIcon name="lock" size={14} /> : <span aria-hidden>✦</span>}
      {locked ? lockedLabel : unlockedLabel}
    </span>
  );
}

/** A sealed slot for content that exists in the design but is not reachable yet. */
export function SealedSlot({
  title,
  detail,
  status = "Not yet built",
  icon,
  tone = "dark",
  className,
}: {
  title: ReactNode;
  detail?: ReactNode;
  status?: string;
  icon?: ReactNode;
  tone?: "dark" | "parchment";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-sm border border-dashed px-3 py-2.5",
        tone === "dark" ? "border-stone-600 bg-void/40" : "border-parchment-400 bg-parchment-200/40",
        className,
      )}
    >
      {icon && <span className="opacity-60 grayscale">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className={cx("text-sm font-bold", tone === "dark" ? "text-text-secondary" : "text-parchment-ink")}>
          {title}
        </p>
        {detail && (
          <p className={cx("text-xs", tone === "dark" ? "text-text-muted" : "text-parchment-ink-soft")}>{detail}</p>
        )}
      </div>
      <LockState locked lockedLabel={status} className={tone === "parchment" ? "!text-parchment-ink-soft" : undefined} />
    </div>
  );
}
