import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** A labeled stat in a recessed plate, e.g. "Total XP 12,400". */
export function StatBadge({
  label,
  value,
  icon,
  hint,
  tone = "dark",
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "dark" | "parchment";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-sm border px-3 py-2",
        tone === "dark"
          ? "q-well border-border-dark"
          : "border-parchment-400/70 bg-parchment-50/50 shadow-[inset_0_1px_3px_rgb(90_60_20/0.2)]",
        className,
      )}
    >
      {icon}
      <div className="min-w-0 leading-tight">
        <dt
          className={cx(
            "text-xs font-bold uppercase tracking-[0.12em]",
            tone === "dark" ? "text-text-muted" : "text-parchment-ink-soft",
          )}
        >
          {label}
        </dt>
        <dd className={cx("text-lg font-bold tabular-nums", tone === "dark" ? "text-text-primary" : "text-parchment-ink")}>
          {value}
        </dd>
        {hint && (
          <dd className={cx("text-xs", tone === "dark" ? "text-text-muted" : "text-parchment-ink-soft")}>{hint}</dd>
        )}
      </div>
    </div>
  );
}
