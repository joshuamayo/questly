import Link from "next/link";
import { CharacterFull } from "@/components/character/CharacterArt";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { skillColor } from "@/components/skills/skill-style";
import { formatNumber } from "@/lib/format";
import type { CharacterSheet } from "@/server/queries/character-sheet";

/** Rail footer: portrait, Total Level, six-Skill mini grid, and permanent honors. */
export function CharacterCard({ sheet, fullUrl }: { sheet: CharacterSheet; fullUrl: string | null }) {
  return (
    <Link
      href="/character"
      className="q-stone q-frame group block p-3 hover:[box-shadow:inset_0_0_0_1px_var(--color-gold-500),var(--shadow-panel)]"
      aria-label={`${sheet.displayName}, Total Level ${sheet.totalLevel}. Open character profile.`}
    >
      <div className="flex gap-3">
        <div className="flex w-14 shrink-0 items-end justify-center">
          <CharacterFull avatar={sheet.avatar} name={sheet.displayName} url={fullUrl} height={84} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="q-title truncate text-lg leading-tight text-text-primary">{sheet.displayName}</p>
          <p className="text-sm text-gold-300">Total Level: {sheet.totalLevel}</p>
          <ul aria-hidden className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
            {sheet.skills.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <SkillIcon icon={s.icon} size={16} framed={false} />
                <span className="text-sm font-bold tabular-nums" style={{ color: skillColor(s.key) }}>
                  {s.progress.level}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <dl className="mt-2.5 space-y-1 border-t border-stone-700 pt-2 text-sm">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Quest Points</dt>
          <dd className="flex items-center gap-2 text-text-secondary">
            <PixelIcon name="qp" size={16} />
            <span className="font-bold text-text-primary">{formatNumber(sheet.questPoints)}</span> Quest Points
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Combat Points</dt>
          <dd className="flex items-center gap-2 text-text-secondary">
            <PixelIcon name="combat-points" size={16} />
            <span className="font-bold text-text-primary">{formatNumber(sheet.combatPoints)}</span> Combat Points
          </dd>
        </div>
      </dl>
    </Link>
  );
}
