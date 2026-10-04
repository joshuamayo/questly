"use client";

import { PixelIcon } from "@/components/icons/PixelIcon";
import { dateCondition, describeDayOffset } from "@/game/quests";
import { formatIsoDate } from "@/lib/dates";
import { useLocalToday } from "@/lib/use-local-today";
import { cx } from "@/lib/cx";

/**
 * Target date and hard deadline, kept distinct (Product Spec §8.4). Passing
 * the target is a gentle note; passing the deadline is stated plainly. No
 * giant red overdue counters.
 */
export function QuestDates({
  targetDate,
  deadline,
  active,
  tone = "dark",
  compact = false,
}: {
  targetDate: string | null;
  deadline: string | null;
  active: boolean;
  tone?: "dark" | "parchment";
  compact?: boolean;
}) {
  const today = useLocalToday();
  const cond = today ? dateCondition(targetDate, deadline, today) : null;
  const muted = tone === "dark" ? "text-text-muted" : "text-parchment-ink-soft";
  const strong = tone === "dark" ? "text-text-primary" : "text-parchment-ink";
  if (!targetDate && !deadline) return compact ? null : <span className={cx("text-sm", muted)}>No target date</span>;
  return (
    <span className={cx("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm", muted)}>
      {targetDate && (
        <span className="inline-flex items-center gap-1.5">
          <PixelIcon name="questlines" size={14} />
          Target: <span className={strong}>{formatIsoDate(targetDate)}</span>
          {active && cond?.daysToTarget !== null && cond?.daysToTarget !== undefined && (
            <span className={cx(cond.pastTarget ? "text-gold-300" : "")}>
              ({cond.pastTarget ? `target passed ${describeDayOffset(cond.daysToTarget)}` : describeDayOffset(cond.daysToTarget)})
            </span>
          )}
        </span>
      )}
      {deadline && (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden>⚑</span>
          Deadline: <span className={strong}>{formatIsoDate(deadline)}</span>
          {active && cond?.daysToDeadline !== null && cond?.daysToDeadline !== undefined && (
            <span className={cx(cond.pastDeadline && "font-bold text-crimson-300")}>
              ({cond.pastDeadline ? `missed ${describeDayOffset(cond.daysToDeadline)}` : describeDayOffset(cond.daysToDeadline)})
            </span>
          )}
        </span>
      )}
    </span>
  );
}
