import { cx } from "@/lib/cx";

export const TIER_LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  ELITE: "Elite",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
};

export const tierColor = (tier: string) => `var(--color-tier-${tier.toLowerCase()})`;

/** Tier shield + label. Color is never the only signal. */
export function TierShield({ tier, size = 20 }: { tier: string; size?: number }) {
  const c = tierColor(tier);
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" className="q-pixel shrink-0">
      <path d="M2 2h12v6c0 3-2.5 5-6 6.5C4.5 13 2 11 2 8z" style={{ fill: c, stroke: "var(--color-border-dark)", strokeWidth: 1.2 }} />
      <path d="M5 5h6v3c0 1.5-1.2 2.6-3 3.4C6.2 10.6 5 9.5 5 8z" style={{ fill: "rgb(255 255 255 / 0.25)" }} />
    </svg>
  );
}

export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  const c = tierColor(tier);
  return (
    <span
      className={cx("inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 text-xs font-bold uppercase tracking-wider", className)}
      style={{ borderColor: c, color: c, backgroundColor: `color-mix(in oklab, ${c}, transparent 85%)` }}
    >
      <TierShield tier={tier} size={12} />
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}
