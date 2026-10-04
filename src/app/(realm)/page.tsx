import type { Metadata } from "next";
import { WorldVista } from "@/components/art/WorldVista";
import { AvatarPlinth } from "@/components/character/AvatarSprite";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { SkillLevelRow } from "@/components/skills/SkillLevelRow";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { SealedSlot } from "@/components/ui/LockedState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { nearestLevelUp } from "@/game/character";
import { formatNumber } from "@/lib/format";
import { loadCharacterSheet, loadChronicle } from "@/server/queries";

export const metadata: Metadata = { title: "World" };

export default async function WorldPage() {
  const [sheet, chronicle] = await Promise.all([loadCharacterSheet(), loadChronicle(6)]);
  const next = nearestLevelUp(sheet.skills);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      {/* ── Vista: the character standing in their world ───────────────── */}
      <section aria-labelledby="world-character" className="q-frame-gold relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <WorldVista />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(12_10_8/0.85),rgb(12_10_8/0.45)_45%,transparent_75%)]" />
        </div>
        <div className="flex min-h-64 flex-col gap-5 p-5 sm:flex-row sm:items-end sm:p-7 lg:min-h-80">
          <AvatarPlinth avatar={sheet.avatar} name={sheet.displayName} height={150} />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Day {formatNumber(sheet.adventureDay)} of your adventure
            </p>
            <h1 id="world-character" className="q-display q-engraved text-display-lg sm:text-display-xl">
              {sheet.displayName}
            </h1>
            <p className="q-display text-lg text-gold-300">{sheet.title?.name ?? "No title equipped"}</p>
            <p className="mt-1 text-sm text-text-secondary">
              Adventuring since <LocalDate iso={sheet.createdAt} /> · {sheet.accountAge}
            </p>
          </div>
          <dl className="q-stone q-frame grid grid-cols-2 gap-x-6 gap-y-3 p-4 sm:min-w-64">
            <div className="col-span-2">
              <dt className="sr-only">Total Level</dt>
              <dd>
                <CurrencyDisplay kind="TOTAL_LEVEL" value={sheet.totalLevel} max={sheet.maxTotalLevel} variant="stacked" />
              </dd>
            </div>
            <div>
              <dt className="sr-only">Quest Points</dt>
              <dd><CurrencyDisplay kind="QP" value={sheet.questPoints} variant="stacked" /></dd>
            </div>
            <div>
              <dt className="sr-only">GP</dt>
              <dd><CurrencyDisplay kind="GP" value={sheet.gp.balance} variant="stacked" /></dd>
            </div>
            <div className="col-span-2">
              <dt className="sr-only">Combat Points</dt>
              <dd><CurrencyDisplay kind="COMBAT_POINTS" value={sheet.combatPoints} variant="stacked" /></dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-5">
          {/* ── Current Adventure ─────────────────────────────────────── */}
          <GamePanel as="section" surface="parchment" labelledBy="current-adventure" className="p-5 sm:p-6">
            <SectionHeader id="current-adventure" title="Current Adventure" eyebrow="Quest Journal" tone="parchment" />
            <EmptyState
              tone="parchment"
              icon={<PixelIcon name="quests" size={56} />}
              title="No active adventure"
              message="Your Quest Journal awaits. Every adventure starts somewhere."
              action={
                <GameLinkButton href="/quests" variant="secondary" size="sm">
                  Open Quest Journal
                </GameLinkButton>
              }
            />
          </GamePanel>

          <div className="grid gap-5 md:grid-cols-2">
            {/* ── Current Boss ──────────────────────────────────────────── */}
            <GamePanel as="section" labelledBy="current-boss" rivets className="p-5">
              <SectionHeader id="current-boss" title="Current Boss" eyebrow="Encounter" />
              <div className="mt-3 flex items-center gap-4">
                <div className="q-well flex size-20 shrink-0 items-center justify-center border border-border-dark">
                  <PixelIcon name="bosses" size={48} className="opacity-35 grayscale" />
                </div>
                <p className="text-text-secondary">No foe currently stands between you and your biggest goal.</p>
              </div>
              <GameLinkButton href="/bosses" variant="ghost" size="sm" className="mt-3 -ml-3">
                Visit the Bosses hall
              </GameLinkButton>
            </GamePanel>

            {/* ── Progress hooks ────────────────────────────────────────── */}
            <GamePanel as="section" labelledBy="progress-hooks" className="p-5">
              <SectionHeader id="progress-hooks" title="On the Horizon" eyebrow="Progress" />
              {next ? (
                <div className="mt-3 flex items-center gap-3">
                  <SkillIcon icon={next.icon} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-secondary">
                      Next level: <span className="font-bold text-text-primary">{next.name} {next.progress.level + 1}</span>
                    </p>
                    <ProgressBar
                      tone="gold"
                      value={next.progress.percentToNext}
                      label={`${next.name} progress to Level ${next.progress.level + 1}`}
                      valueText={`${formatNumber(next.progress.xpRemaining)} XP remaining`}
                    />
                    <p className="text-xs text-text-muted">{formatNumber(next.progress.xpRemaining)} XP remaining</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-text-secondary">Every Skill is mastered.</p>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <SealedSlot icon={<PixelIcon name="combat" size={20} />} title="Tracked Combat Achievement" />
                <SealedSlot icon={<PixelIcon name="diaries" size={20} />} title="Diary tier" />
              </div>
            </GamePanel>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* ── Skills ─────────────────────────────────────────────────── */}
          <GamePanel as="section" labelledBy="world-skills" className="p-4">
            <SectionHeader
              id="world-skills"
              title="Skills"
              eyebrow={`Total Level ${sheet.totalLevel}`}
              action={
                <GameLinkButton href="/skills" variant="ghost" size="sm">
                  View all
                </GameLinkButton>
              }
            />
            <ul className="mt-2 flex flex-col">
              {sheet.skills.map((skill) => (
                <li key={skill.key}>
                  <SkillLevelRow skill={skill} href={`/skills?skill=${skill.key}`} />
                </li>
              ))}
            </ul>
          </GamePanel>

          {/* ── Chronicle (real recorded events only) ──────────────────── */}
          <GamePanel as="section" surface="timber" labelledBy="chronicle" className="p-4">
            <SectionHeader id="chronicle" title="Chronicle" eyebrow="Recent events" />
            <ol className="mt-3 flex flex-col gap-2">
              {chronicle.map((entry) => (
                <li key={entry.id} className="flex items-start gap-2 text-sm">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-gold-400" />
                  <span className="flex-1 text-text-primary">{entry.text}</span>
                  <span className="shrink-0 text-xs text-text-muted">
                    <LocalDate iso={entry.createdAt} options={{ month: "short", day: "numeric" }} />
                  </span>
                </li>
              ))}
            </ol>
          </GamePanel>
        </div>
      </div>
    </div>
  );
}
