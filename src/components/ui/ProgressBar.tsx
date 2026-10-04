import { cx } from "@/lib/cx";

type Tone = "gold" | "moss" | "teal" | "crimson";

const FILL: Record<Tone, string> = {
  gold: "bg-[linear-gradient(180deg,var(--color-gold-200),var(--color-gold-400)_50%,var(--color-gold-600))]",
  moss: "bg-[linear-gradient(180deg,var(--color-moss-300),var(--color-moss-500)_50%,var(--color-moss-700))]",
  teal: "bg-[linear-gradient(180deg,var(--color-teal-300),var(--color-teal-500)_50%,var(--color-teal-700))]",
  crimson: "bg-[linear-gradient(180deg,var(--color-crimson-300),var(--color-crimson-500)_50%,var(--color-crimson-700))]",
};

/**
 * Segmented, recessed progress bar. Always exposes an accessible name and a
 * text value; the visual fill is never the only signal (CLAUDE.md §28).
 */
export function ProgressBar({
  value,
  label,
  valueText,
  tone = "moss",
  color,
  size = "md",
  showValue = false,
  className,
}: {
  /** 0–100 */
  value: number;
  label: string;
  valueText?: string;
  tone?: Tone;
  /** Custom fill color token (e.g. a Skill color). Overrides `tone`. */
  color?: string;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const text = valueText ?? `${Math.floor(pct)}%`;
  const height = size === "sm" ? "h-2" : size === "lg" ? "h-5" : "h-3";
  return (
    <div className={cx("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(pct)}
        aria-valuetext={text}
        className={cx("q-well relative flex-1 overflow-hidden border border-border-dark", height)}
      >
        <div
          className={cx(
            "h-full transition-[width] duration-[var(--duration-fill)] ease-[var(--ease-game)]",
            !color && FILL[tone],
          )}
          style={{
            width: `${pct}%`,
            ...(color && {
              backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${color}, white 35%), ${color} 50%, color-mix(in oklab, ${color}, black 30%))`,
            }),
          }}
        />
        {/* Segment notches give the bar its game-meter feel. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_calc(10%-1px),rgb(0_0_0/0.35)_calc(10%-1px)_10%)]"
        />
      </div>
      {showValue && <span className="min-w-[3.5ch] text-right text-sm tabular-nums text-text-secondary">{text}</span>}
    </div>
  );
}
