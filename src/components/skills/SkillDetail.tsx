import { SkillIcon } from "@/components/icons/SkillIcon";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SealedSlot } from "@/components/ui/LockedState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatBadge } from "@/components/ui/StatBadge";
import { formatNumber } from "@/lib/format";
import type { SkillSheet } from "@/server/queries/character-sheet";

/** Parchment mastery pane for one Skill. */
export function SkillDetail({ skill, id }: { skill: SkillSheet; id?: string }) {
  const p = skill.progress;
  const nextLabel = p.isMaxLevel ? "Mastered" : `Level ${p.level + 1}`;
  return (
    <article id={id} aria-labelledby={`${id}-title`} className="q-parchment q-frame scroll-mt-24 p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <SkillIcon icon={skill.icon} size={56} />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-parchment-ink-soft">Skill Mastery</p>
          <h2 id={`${id}-title`} className="q-display text-display-md text-parchment-ink">
            {skill.name}
          </h2>
          <p className="italic text-parchment-ink-soft">{skill.motto}</p>
        </div>
        <div className="ml-auto text-center">
          <p className="q-display text-display-lg leading-none text-parchment-ink">{p.level}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-parchment-ink-soft">of 99</p>
        </div>
      </div>

      <p className="mt-4 text-parchment-ink">{skill.description}</p>

      <div className="mt-5">
        <div className="mb-1 flex justify-between text-sm font-bold text-parchment-ink">
          <span>Level {p.level}</span>
          <span>{nextLabel}</span>
        </div>
        <ProgressBar
          size="lg"
          tone={skill.key === "focus" ? "teal" : "gold"}
          value={p.percentToNext}
          label={`${skill.name} progress to ${nextLabel}`}
          valueText={p.isMaxLevel ? "Maximum level reached" : `${p.percentToNext}% — ${formatNumber(p.xpRemaining)} XP remaining`}
        />
        <p className="mt-1 text-sm text-parchment-ink-soft">
          {p.isMaxLevel
            ? "Level 99 reached. XP continues to accumulate."
            : `${p.percentToNext}% of the way · ${formatNumber(p.xpRemaining)} XP to ${nextLabel}`}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        <StatBadge tone="parchment" label="Total XP" value={formatNumber(p.totalXp)} />
        <StatBadge tone="parchment" label="XP remaining" value={p.isMaxLevel ? "—" : formatNumber(p.xpRemaining)} />
        <StatBadge tone="parchment" label={`Level ${p.level} at`} value={`${formatNumber(p.currentLevelXp)} XP`} />
        <StatBadge
          tone="parchment"
          label={p.isMaxLevel ? "Maximum level" : `Level ${p.level + 1} at`}
          value={p.nextLevelXp === null ? "—" : `${formatNumber(p.nextLevelXp)} XP`}
        />
      </dl>

      <section aria-label={`${skill.name} unlocks`} className="mt-6">
        <h3 className="q-display text-base text-parchment-ink">Unlocks</h3>
        <div className="mt-2 flex flex-col gap-2">
          <SealedSlot
            tone="parchment"
            icon={<PixelIcon name="total-level" size={20} />}
            title={`Level 99 · ${skill.name} Cape`}
            detail="A cosmetic cape worn by those who master this Skill."
            status={p.isMaxLevel ? "Earned" : "Level 99"}
          />
          <SealedSlot
            tone="parchment"
            title="Further milestone unlocks"
            detail="Titles, frames, and new Quest content tied to Skill levels arrive in a later update."
          />
        </div>
      </section>
    </article>
  );
}
