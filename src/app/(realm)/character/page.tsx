import type { Metadata } from "next";
import Link from "next/link";
import { AvatarPlinth } from "@/components/character/AvatarSprite";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { SealedSlot } from "@/components/ui/LockedState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatBadge } from "@/components/ui/StatBadge";
import { formatNumber } from "@/lib/format";
import { loadCharacterSheet } from "@/server/queries";

export const metadata: Metadata = { title: "Character" };

export default async function CharacterPage() {
  const sheet = await loadCharacterSheet();

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeader level={1} title="Character" eyebrow="Permanent account record" />
      <div className="q-rule my-4" />

      <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* ── Identity ──────────────────────────────────────────────────── */}
        <GamePanel as="section" labelledBy="char-name" gold rivets className="flex flex-col items-center p-6 text-center">
          <div className="q-well w-full border border-border-dark bg-[radial-gradient(ellipse_at_50%_30%,var(--color-stone-800),var(--color-void))] px-4 pb-4 pt-6">
            <AvatarPlinth avatar={sheet.avatar} name={sheet.displayName} height={168} />
          </div>
          <h2 id="char-name" className="q-display q-engraved mt-4 text-display-md">
            {sheet.displayName}
          </h2>
          <p className="q-display text-gold-300">{sheet.title?.name ?? "No title equipped"}</p>
          <dl className="mt-4 grid w-full gap-2 text-left">
            <StatBadge label="Equipped title" value={sheet.title?.name ?? "None"} />
            <StatBadge label="Equipped cape" value={sheet.cape?.name ?? "None"} hint={sheet.cape ? undefined : "Skill Capes are earned at Level 99."} />
            <StatBadge
              label="Adventuring since"
              value={<LocalDate iso={sheet.createdAt} />}
              hint={`${sheet.accountAge} · Day ${formatNumber(sheet.adventureDay)}`}
            />
          </dl>
        </GamePanel>

        <div className="flex flex-col gap-5">
          {/* ── Stats grid ─────────────────────────────────────────────── */}
          <GamePanel as="section" labelledBy="char-skills" className="p-5">
            <SectionHeader
              id="char-skills"
              title="Skills"
              action={<CurrencyDisplay kind="TOTAL_LEVEL" value={sheet.totalLevel} max={sheet.maxTotalLevel} variant="stacked" />}
            />
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sheet.skills.map((skill) => (
                <li key={skill.key}>
                  <Link
                    href={`/skills?skill=${skill.key}`}
                    className="q-well flex items-center gap-3 border border-border-dark p-2.5 hover:border-gold-700"
                  >
                    <SkillIcon icon={skill.icon} size={28} framed={false} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-text-secondary">{skill.name}</span>
                      <ProgressBar
                        size="sm"
                        tone={skill.key === "focus" ? "teal" : "moss"}
                        value={skill.progress.percentToNext}
                        label={`${skill.name} progress`}
                        valueText={`Level ${skill.progress.level}, ${skill.progress.percentToNext}% to next`}
                      />
                    </span>
                    <span className="q-display text-2xl tabular-nums text-gold-200">
                      <span className="sr-only">Level </span>
                      {skill.progress.level}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </GamePanel>

          <div className="grid gap-5 md:grid-cols-2">
            {/* ── Honors & treasury ──────────────────────────────────────── */}
            <GamePanel as="section" labelledBy="char-honors" className="p-5">
              <SectionHeader id="char-honors" title="Honors & Treasury" />
              <div className="mt-4 flex flex-col gap-4">
                <CurrencyDisplay kind="QP" value={sheet.questPoints} variant="stacked" />
                <CurrencyDisplay kind="COMBAT_POINTS" value={sheet.combatPoints} variant="stacked" />
                <CurrencyDisplay kind="GP" value={sheet.gp.balance} variant="stacked" />
              </div>
            </GamePanel>

            {/* ── Lifetime record (only stats that exist) ─────────────────── */}
            <GamePanel as="section" surface="parchment" labelledBy="char-lifetime" className="p-5">
              <SectionHeader id="char-lifetime" title="Lifetime Record" tone="parchment" />
              <dl className="mt-4 grid grid-cols-2 gap-2">
                <StatBadge tone="parchment" label="Total XP" value={formatNumber(sheet.totalXp)} />
                <StatBadge tone="parchment" label="Days adventuring" value={formatNumber(sheet.adventureDay)} />
                <StatBadge tone="parchment" label="GP earned" value={formatNumber(sheet.gp.lifetimeEarned)} />
                <StatBadge tone="parchment" label="GP spent" value={formatNumber(sheet.gp.lifetimeSpent)} />
              </dl>
            </GamePanel>
          </div>

          {/* ── Records from systems not yet built ─────────────────────── */}
          <GamePanel as="section" labelledBy="char-future" className="p-5">
            <SectionHeader id="char-future" title="Deeds Yet Unwritten" eyebrow="Arriving with future systems" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <SealedSlot icon={<PixelIcon name="quests" size={20} />} title="Quests completed" />
              <SealedSlot icon={<PixelIcon name="bosses" size={20} />} title="Bosses defeated" />
              <SealedSlot icon={<PixelIcon name="collection" size={20} />} title="Collection Log" />
              <SealedSlot icon={<PixelIcon name="diaries" size={20} />} title="Achievement Diaries" />
              <SealedSlot icon={<PixelIcon name="combat" size={20} />} title="Combat Achievements" />
              <SealedSlot icon={<PixelIcon name="skill-focus" size={20} />} title="Focus sessions" />
            </div>
          </GamePanel>
        </div>
      </div>
    </div>
  );
}
