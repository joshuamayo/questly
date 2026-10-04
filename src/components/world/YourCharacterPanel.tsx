import { CharacterFull } from "@/components/character/CharacterArt";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { GamePanel } from "@/components/ui/GamePanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatNumber } from "@/lib/format";
import type { CharacterSheet } from "@/server/queries/character-sheet";

export function YourCharacterPanel({ sheet, artUrl }: { sheet: CharacterSheet; artUrl: string | null }) {
  return (
    <GamePanel as="section" labelledBy="your-character" className="overflow-hidden">
      <h2 id="your-character" className="q-display border-b border-stone-700 px-5 py-2.5 text-sm tracking-[0.14em] text-gold-300">
        YOUR CHARACTER
      </h2>
      <div className="flex">
        <div className="flex w-24 shrink-0 items-end justify-center overflow-hidden border-r border-stone-700 bg-[radial-gradient(ellipse_at_50%_35%,var(--color-stone-800),var(--color-void))] pt-3 sm:w-40">
          <CharacterFull avatar={sheet.avatar} name={sheet.displayName} url={artUrl} height={190} className="max-w-full" />
        </div>
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <p className="q-title text-2xl uppercase leading-tight text-text-primary">{sheet.displayName}</p>
          <p className="text-lg text-text-primary">
            Total Level: <span className="font-bold">{sheet.totalLevel}</span>
            <span className="text-text-muted"> / {sheet.maxTotalLevel}</span>
          </p>
          <ProgressBar
            tone="gold"
            size="sm"
            className="mt-1"
            value={(sheet.totalLevel / sheet.maxTotalLevel) * 100}
            label="Total Level toward maximum"
            valueText={`${sheet.totalLevel} of ${sheet.maxTotalLevel}`}
          />
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:gap-x-5">
            {sheet.skills.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <SkillIcon icon={s.icon} size={20} framed={false} />
                <span className="flex-1 truncate text-sm text-text-secondary sm:text-base">{s.name}</span>
                <span className="font-bold tabular-nums text-text-primary">
                  <span className="sr-only">Level </span>
                  {s.progress.level}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <dl className="grid grid-cols-3 divide-x divide-stone-700 border-t border-stone-700">
        {[
          { icon: "qp" as const, label: "Quest Points", value: sheet.questPoints },
          { icon: "combat-points" as const, label: "Combat Points", value: sheet.combatPoints },
          { icon: "gp" as const, label: "GP", value: sheet.gp.balance },
        ].map((stat) => (
          <div key={stat.label} className="relative py-2.5 pl-11 pr-2.5 leading-tight sm:pl-14 sm:pr-4">
            <dt className="text-sm text-text-secondary">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 sm:left-4">
                <PixelIcon name={stat.icon} size={26} />
              </span>
              {stat.label}
            </dt>
            <dd className="text-lg font-bold tabular-nums text-text-primary">{formatNumber(stat.value)}</dd>
          </div>
        ))}
      </dl>
    </GamePanel>
  );
}
