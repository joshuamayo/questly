import type { Metadata } from "next";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { GamePanel } from "@/components/ui/GamePanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatBadge } from "@/components/ui/StatBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SkillsBoard } from "@/components/skills/SkillsBoard";
import { formatNumber } from "@/lib/format";
import { loadCharacterSheet } from "@/server/queries";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsPage({ searchParams }: PageProps<"/skills">) {
  const [sheet, params] = await Promise.all([loadCharacterSheet(), searchParams]);
  const initialKey = typeof params.skill === "string" ? params.skill : undefined;
  const highest = sheet.skills.reduce((best, s) => (s.progress.totalXp > best.progress.totalXp ? s : best));
  const mastered = sheet.skills.filter((s) => s.progress.isMaxLevel).length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader level={1} title="Skills" eyebrow="Character progression" />
        <div className="flex flex-wrap items-center gap-4">
          <CurrencyDisplay kind="TOTAL_LEVEL" value={sheet.totalLevel} max={sheet.maxTotalLevel} variant="stacked" />
          <p className="text-sm text-text-muted">
            <span className="font-bold text-text-secondary">{formatNumber(sheet.totalXp)}</span> total XP
          </p>
        </div>
      </div>
      <div className="q-rule my-4" />
      <SkillsBoard
        key={initialKey ?? "default"}
        skills={sheet.skills}
        initialKey={initialKey}
        footer={
          <GamePanel as="section" labelledBy="skill-totals" className="p-5">
            <SectionHeader id="skill-totals" title="Account Mastery" level={2} />
            <div className="mt-4">
              <ProgressBar
                tone="gold"
                size="lg"
                value={(sheet.totalLevel / sheet.maxTotalLevel) * 100}
                label="Total Level toward maximum"
                valueText={`Total Level ${sheet.totalLevel} of ${sheet.maxTotalLevel}`}
              />
              <p className="mt-1 text-sm text-text-muted">
                Total Level {sheet.totalLevel} of {sheet.maxTotalLevel} — the sum of your six Skill levels.
              </p>
            </div>
            <dl className="mt-4 grid gap-2 sm:grid-cols-3">
              <StatBadge label="Total XP" value={formatNumber(sheet.totalXp)} />
              <StatBadge label="Highest Skill" value={`${highest.name} ${highest.progress.level}`} />
              <StatBadge label="Skills at 99" value={`${mastered} / ${sheet.skills.length}`} />
            </dl>
          </GamePanel>
        }
      />
    </div>
  );
}
