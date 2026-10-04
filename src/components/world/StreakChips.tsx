import { PixelIcon } from "@/components/icons/PixelIcon";
import type { StreakView } from "@/server/streaks/service";

/** Compact streak summary. Every value carries a text label, never color alone. */
export function StreakChips({ streaks, className }: { streaks: StreakView; className?: string }) {
  const items = [
    { label: "Adventure Streak", value: streaks.adventure.current, best: streaks.adventure.best, icon: "sword" as const },
    { label: "Focus Streak", value: streaks.focus.current, best: streaks.focus.best, icon: "skill-focus" as const },
    { label: "Deadline Streak", value: streaks.deadline.current, best: streaks.deadline.best, icon: "diaries" as const },
  ];
  return (
    <ul className={className ?? "flex flex-wrap gap-2"} aria-label="Streaks">
      {items.map((i) => (
        <li key={i.label} className="q-well flex items-center gap-1.5 border border-border-dark px-2 py-1 text-sm" title={`${i.label}: ${i.value} (best ${i.best})`}>
          <PixelIcon name={i.icon} size={16} />
          <span className="font-bold tabular-nums text-gold-200">{i.value}</span>
          <span className="text-text-muted">{i.label.replace(" Streak", "")}</span>
        </li>
      ))}
      <li className="q-well flex items-center gap-1.5 border border-border-dark px-2 py-1 text-sm" title="Streak Shields protect a missed adventuring day">
        <PixelIcon name="combat" size={16} />
        <span className="font-bold tabular-nums text-blue-300">
          {streaks.shields}/{streaks.maxShields}
        </span>
        <span className="text-text-muted">Shields</span>
      </li>
    </ul>
  );
}
