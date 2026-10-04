import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { formatCompact, formatNumber } from "@/lib/format";
import { cx } from "@/lib/cx";

export type CurrencyKind = "GP" | "QP" | "COMBAT_POINTS" | "TOTAL_LEVEL";

const META: Record<CurrencyKind, { icon: SpriteName; short: string; long: string; color: string }> = {
  GP: { icon: "gp", short: "GP", long: "GP", color: "text-gold-200" },
  QP: { icon: "qp", short: "QP", long: "Quest Points", color: "text-blue-300" },
  COMBAT_POINTS: { icon: "combat-points", short: "CP", long: "Combat Points", color: "text-crimson-300" },
  TOTAL_LEVEL: { icon: "total-level", short: "Total", long: "Total Level", color: "text-gold-100" },
};

/**
 * Icon + value + label for a progression value. The label is always present
 * (visually or for screen readers), so the icon never carries meaning alone.
 */
export function CurrencyDisplay({
  kind,
  value,
  max,
  variant = "inline",
  compact = false,
  className,
}: {
  kind: CurrencyKind;
  value: number;
  max?: number;
  variant?: "inline" | "stacked" | "chip";
  compact?: boolean;
  className?: string;
}) {
  const m = META[kind];
  const shown = compact ? formatCompact(value) : formatNumber(value);
  const full = `${m.long}: ${formatNumber(value)}${max ? ` of ${formatNumber(max)}` : ""}`;

  if (variant === "stacked") {
    return (
      <div className={cx("flex items-center gap-3", className)}>
        <PixelIcon name={m.icon} size={36} />
        <div className="leading-tight">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">{m.long}</p>
          <p className={cx("q-display text-2xl tabular-nums", m.color)}>
            {shown}
            {max ? <span className="text-sm text-text-muted"> / {formatNumber(max)}</span> : null}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "chip") {
    return (
      <span
        className={cx(
          "q-well inline-flex items-center gap-1.5 border border-border-dark px-2 py-1",
          className,
        )}
        title={full}
      >
        <PixelIcon name={m.icon} size={18} />
        <span className="sr-only">{full}</span>
        <span aria-hidden className="flex items-baseline gap-1">
          <span className={cx("font-bold tabular-nums", m.color)}>{shown}</span>
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-text-muted">{m.short}</span>
        </span>
      </span>
    );
  }

  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <PixelIcon name={m.icon} size={20} />
      <span className={cx("font-bold tabular-nums", m.color)}>{shown}</span>
      <span className="text-sm text-text-muted">{m.long}</span>
    </span>
  );
}
