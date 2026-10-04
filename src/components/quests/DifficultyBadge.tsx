import { QUEST_DIFFICULTIES, QUEST_DIFFICULTY_LABELS, type QuestDifficulty } from "@/game/vocabulary";
import { cx } from "@/lib/cx";

/** Difficulty label + pips (1–5). Never relies on color alone. */
export function DifficultyBadge({ difficulty, className }: { difficulty: QuestDifficulty; className?: string }) {
  const rank = QUEST_DIFFICULTIES.indexOf(difficulty) + 1;
  const color = `var(--color-difficulty-${difficulty.toLowerCase()})`;
  return (
    <span
      className={cx("inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 text-xs font-bold uppercase tracking-wider", className)}
      style={{ borderColor: color, color, backgroundColor: `color-mix(in oklab, ${color}, transparent 82%)` }}
    >
      <span aria-hidden className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="size-1.5 rotate-45" style={{ backgroundColor: i < rank ? color : "transparent", outline: `1px solid ${color}` }} />
        ))}
      </span>
      {QUEST_DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}
