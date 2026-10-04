"use client";

import { bountyFor, BOUNTY_TIER_LABELS, type BountySnapshot } from "@/game/bosses";
import { formatIsoDate } from "@/lib/dates";
import { useLocalToday } from "@/lib/use-local-today";

/** Bounty ladder with the tier that applies if the Boss falls today. */
export function BountyStatus({ bounty, targetDate, deadline }: { bounty: BountySnapshot | null; targetDate: string | null; deadline: string | null }) {
  const today = useLocalToday();
  if (!bounty) return <p className="text-sm text-text-muted">No bounty on this Boss.</p>;
  if (!targetDate && !deadline) {
    return <p className="text-sm text-text-muted">Set a target date or deadline on this Quest to put a bounty on it.</p>;
  }
  const now = today ? bountyFor(bounty, targetDate, deadline, today) : null;
  const rows = [
    { tier: "EARLY", gp: bounty.earlyGp, when: targetDate ? `Before ${formatIsoDate(targetDate)}` : null },
    { tier: "BY_TARGET", gp: bounty.byTargetGp, when: targetDate ? `On ${formatIsoDate(targetDate)}` : null },
    { tier: "BY_DEADLINE", gp: bounty.byDeadlineGp, when: deadline ? `By ${formatIsoDate(deadline)}` : null },
    { tier: "LATE", gp: bounty.lateGp, when: "Later" },
  ].filter((r) => r.when) as { tier: keyof typeof BOUNTY_TIER_LABELS; gp: number; when: string }[];
  return (
    <div>
      {now && (
        <p className="text-text-primary">
          Defeat it today: <span className="font-bold text-gold-200">+{now.gp} GP</span> ({BOUNTY_TIER_LABELS[now.tier]})
        </p>
      )}
      <ul className="mt-2 text-sm">
        {rows.map((r) => (
          <li key={r.tier} className="flex justify-between border-b border-stone-800 py-1 last:border-0">
            <span className={now?.tier === r.tier ? "font-bold text-gold-200" : "text-text-secondary"}>
              {now?.tier === r.tier && <span aria-hidden>▸ </span>}
              {r.when}
            </span>
            <span className="tabular-nums text-text-primary">+{r.gp} GP</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-text-muted">The bounty is a bonus. Normal Quest rewards are always paid, and GP is never taken away.</p>
    </div>
  );
}
