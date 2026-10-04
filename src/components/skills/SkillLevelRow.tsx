import Link from "next/link";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatNumber } from "@/lib/format";
import type { SkillSheet } from "@/server/queries/character-sheet";

/** Compact skill readout: icon, name, level, and progress to next level. */
export function SkillLevelRow({ skill, href }: { skill: SkillSheet; href?: string }) {
  const p = skill.progress;
  const content = (
    <>
      <SkillIcon icon={skill.icon} size={24} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-bold text-text-primary">{skill.name}</span>
          <span className="q-display text-lg tabular-nums text-gold-200">
            <span className="sr-only">Level </span>
            {p.level}
            <span className="text-xs text-text-muted"> /99</span>
          </span>
        </div>
        <ProgressBar
          size="sm"
          tone={skill.key === "focus" ? "teal" : "moss"}
          value={p.percentToNext}
          label={`${skill.name} progress to Level ${p.isMaxLevel ? 99 : p.level + 1}`}
          valueText={
            p.isMaxLevel ? "Maximum level" : `${formatNumber(p.xpRemaining)} XP to Level ${p.level + 1}`
          }
        />
        <p className="mt-0.5 text-xs text-text-muted">
          {p.isMaxLevel ? "Mastered" : `${formatNumber(p.xpRemaining)} XP to Level ${p.level + 1}`}
        </p>
      </div>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-sm border border-transparent px-2 py-1.5 hover:border-stone-600 hover:bg-void/40"
    >
      {content}
    </Link>
  ) : (
    <div className="flex items-center gap-3 px-2 py-1.5">{content}</div>
  );
}
