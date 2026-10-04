import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WorldVista } from "@/components/art/WorldVista";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { skillColor } from "@/components/skills/skill-style";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { SealedSlot } from "@/components/ui/LockedState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Greeting } from "@/components/world/Greeting";
import { YourCharacterPanel } from "@/components/world/YourCharacterPanel";
import { formatNumber } from "@/lib/format";
import { artUrl } from "@/server/art";
import { loadCharacterSheet, loadChronicle, loadCurrentAdventure, loadCurrentBoss, loadQuestlineDetail, loadQuestlines } from "@/server/queries";
import { nodeState } from "@/components/questlines/node-state";
import { DifficultyBadge } from "@/components/quests/DifficultyBadge";
import { QuestDates } from "@/components/quests/QuestDates";
import { QUEST_STATUS_LABELS } from "@/game/quests";

export const metadata: Metadata = { title: "World" };

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <GameLinkButton href={href} variant="ghost" size="sm" className="px-0" aria-label={label}>
      View All →
    </GameLinkButton>
  );
}

export default async function WorldPage() {
  const [sheet, chronicle, adventure, boss, lines] = await Promise.all([
    loadCharacterSheet(),
    loadChronicle(5),
    loadCurrentAdventure(),
    loadCurrentBoss(),
    loadQuestlines(),
  ]);
  const activeLine = lines.find((l) => l.status === "ACTIVE") ?? null;
  const lineDetail = activeLine ? await loadQuestlineDetail(activeLine.id) : null;
  const mapUrl = artUrl("world/map");
  const top = sheet.skills.reduce((best, s) => (s.progress.totalXp > best.progress.totalXp ? s : best));
  const tp = top.progress;

  return (
    <div className="flex flex-col gap-4">
      {/* ── World map hero ───────────────────────────────────────────── */}
      <section aria-labelledby="world-greeting" className="relative isolate -mx-3 -mt-4 sm:-mx-5 lg:-mx-6 lg:-mt-0">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          {mapUrl ? (
            <Image src={mapUrl} alt="" fill priority unoptimized sizes="100vw" className="q-pixel object-cover" />
          ) : (
            <WorldVista />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_14_19/0.7),transparent_35%,transparent_70%,var(--color-backdrop)),linear-gradient(90deg,rgb(11_14_19/0.6),transparent_45%)]" />
        </div>
        <div className="flex min-h-72 flex-col gap-5 px-3 pb-4 pt-6 sm:px-5 lg:min-h-[27rem] lg:px-6 lg:pt-7 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 id="world-greeting" className="q-title q-engraved text-display-lg lg:text-display-xl">
              <Greeting name={sheet.displayName} />
            </h1>
            <p className="mt-1 text-lg text-text-primary [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
              What adventure will you pursue today?
            </p>
            <p className="mt-2 text-sm text-text-secondary [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
              Day {formatNumber(sheet.adventureDay)} of your adventure · Adventuring since{" "}
              <LocalDate iso={sheet.createdAt} />
            </p>
          </div>
          <div className="w-full max-w-xl xl:mt-12 xl:w-[30rem] xl:shrink-0">
            <YourCharacterPanel sheet={sheet} artUrl={artUrl("character/full")} />
          </div>
        </div>
      </section>

      {/* ── Adventure row ─────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr]">
        <GamePanel as="section" labelledBy="current-adventure" className="flex flex-col p-4 md:col-span-2 xl:col-span-1">
          <SectionHeader
            id="current-adventure"
            icon={<PixelIcon name="combat" size={22} />}
            title="Current Adventure"
            action={<ViewAll href="/quests" label="View all Quests" />}
            divider
          />
          {boss && (
            <Link
              href="/bosses"
              className="mt-3 flex items-center gap-3 rounded-sm border border-crimson-500/70 bg-crimson-700/20 px-3 py-2 hover:border-crimson-400"
            >
              <PixelIcon name="bosses" size={28} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wider text-crimson-300">Current Boss</span>
                <span className="block truncate text-text-primary">{boss.title}</span>
              </span>
              <span className="w-28">
                <ProgressBar size="sm" tone="crimson" value={boss.hp} label="Boss HP" valueText={`${boss.hp}% HP`} />
                <span className="block text-right text-xs text-text-muted">{boss.hp}% HP</span>
              </span>
            </Link>
          )}
          {adventure ? (
            <>
              <div className="flex flex-1 flex-col gap-4 pt-3 sm:flex-row sm:items-start">
                <SkillIcon icon={adventure.icon} size={64} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">
                    {adventure.priority === "MAIN" ? "Main Quest" : "Side Quest"} · {QUEST_STATUS_LABELS[adventure.status]}
                  </p>
                  <p className="q-title text-2xl leading-tight text-text-primary">{adventure.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <DifficultyBadge difficulty={adventure.difficulty} />
                    <span className="text-sm" style={{ color: skillColor(adventure.skillKey) }}>
                      {adventure.skillName}
                    </span>
                  </div>
                  {adventure.description && <p className="mt-2 line-clamp-2 text-text-secondary">{adventure.description}</p>}
                  {adventure.currentStep && (
                    <p className="mt-2 text-text-primary">
                      <span className="text-blue-300">Current Step:</span> {adventure.currentStep}
                    </p>
                  )}
                  {adventure.progress.total > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar
                        className="flex-1"
                        color={skillColor(adventure.skillKey)}
                        value={adventure.progress.percent}
                        label="Current adventure progress"
                        valueText={`${adventure.progress.done} of ${adventure.progress.total} objectives`}
                      />
                      <span className="text-sm tabular-nums text-text-secondary">{adventure.progress.percent}% complete</span>
                    </div>
                  )}
                  <div className="mt-2">
                    <QuestDates targetDate={adventure.targetDate} deadline={adventure.deadline} active compact />
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-stone-700 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Rewards (completion)</p>
                <p className="mt-1 flex flex-wrap gap-x-4 text-text-primary">
                  <span>+{formatNumber(adventure.rewards.xp)} {adventure.skillName} XP</span>
                  <span>+{adventure.rewards.gp} GP</span>
                  <span>+{adventure.rewards.qp} QP</span>
                </p>
              </div>
              <GameLinkButton href={`/quests/${adventure.id}`} variant="primary" className="mt-4 w-full">
                Continue Adventure →
              </GameLinkButton>
            </>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-4 pt-3 sm:flex-row sm:items-center">
                <div className="q-well flex size-24 shrink-0 items-center justify-center self-center border border-border-dark">
                  <PixelIcon name="quests" size={56} />
                </div>
                <div className="flex-1">
                  <p className="q-title text-xl text-text-primary">No active adventure</p>
                  <p className="text-text-secondary">Your Quest Journal awaits. Every adventure starts somewhere.</p>
                  {!boss && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                      <PixelIcon name="bosses" size={16} className="opacity-60" />
                      No foe currently stands between you and your biggest goal.
                    </p>
                  )}
                </div>
              </div>
              <GameLinkButton href="/quests/board" variant="primary" className="mt-4 w-full">
                Begin Adventure →
              </GameLinkButton>
            </>
          )}
        </GamePanel>

        <GamePanel as="section" labelledBy="world-questline" className="flex flex-col p-4">
          <SectionHeader
            id="world-questline"
            icon={<PixelIcon name="questlines" size={22} />}
            title="Questline"
            action={<ViewAll href="/questlines" label="View all Questlines" />}
            divider
          />
          {lineDetail ? (
            <div className="flex flex-1 flex-col pt-3">
              <p className="q-title text-xl leading-tight text-text-primary">{lineDetail.title}</p>
              <p className="text-sm text-text-secondary">
                {lineDetail.completed} / {lineDetail.total} Quests
              </p>
              <ol className="mt-2 flex flex-col gap-1">
                {lineDetail.nodes.slice(0, 6).map((n) => {
                  const st = nodeState(n);
                  return (
                    <li key={n.id} className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden
                        className={
                          st === "completed"
                            ? "flex size-5 items-center justify-center rounded-full bg-moss-600 text-xs text-white"
                            : st === "active"
                              ? "size-5 rounded-full border-2 border-blue-300 bg-blue-600/40"
                              : st === "available"
                                ? "size-5 rounded-full border-2 border-gold-400"
                                : "size-5 rounded-full border-2 border-stone-600"
                        }
                      >
                        {st === "completed" ? "✓" : ""}
                      </span>
                      <span className={st === "completed" ? "text-text-muted" : st === "locked" ? "text-text-muted" : "text-text-primary"}>{n.title}</span>
                      <span className="sr-only">({st})</span>
                    </li>
                  );
                })}
              </ol>
              <GameLinkButton href={`/questlines?id=${lineDetail.id}`} variant="secondary" size="sm" className="mt-auto w-full">
                View Questline →
              </GameLinkButton>
            </div>
          ) : (
            <EmptyState
              className="flex-1"
              icon={<PixelIcon name="questlines" size={44} className="opacity-70" />}
              title="No Questline charted"
              message="Questlines turn your biggest goals into adventure paths of linked Quests."
              action={
                <GameLinkButton href="/questlines/new" variant="secondary" size="sm">
                  Chart a Questline
                </GameLinkButton>
              }
            />
          )}
        </GamePanel>

        <GamePanel as="section" labelledBy="skill-progression" className="flex flex-col p-4">
          <SectionHeader
            id="skill-progression"
            icon={<PixelIcon name="skills" size={22} />}
            title="Skill Progression"
            action={<ViewAll href="/skills" label="View all Skills" />}
            divider
          />
          <div className="flex items-center gap-3 pt-3">
            <SkillIcon icon={top.icon} size={36} />
            <div className="min-w-0 flex-1">
              <p className="q-title text-xl text-text-primary">
                {top.name} — Level {tp.level}
              </p>
              <p className="text-sm text-text-secondary">{formatNumber(tp.totalXp)} XP</p>
            </div>
          </div>
          <ProgressBar
            className="mt-2"
            color={skillColor(top.key)}
            value={tp.percentToNext}
            label={`${top.name} progress to Level ${tp.isMaxLevel ? 99 : tp.level + 1}`}
            valueText={tp.isMaxLevel ? "Maximum level" : `${formatNumber(tp.xpRemaining)} XP to Level ${tp.level + 1}`}
          />
          <p className="mt-1 text-sm text-text-secondary">
            {tp.isMaxLevel ? "Mastered" : `Next level (${tp.level + 1}): ${formatNumber(tp.xpRemaining)} XP`}
          </p>
          <p className="mt-3 text-sm font-bold text-gold-300">Upcoming Unlocks</p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            <SealedSlot
              icon={<PixelIcon name="total-level" size={18} />}
              title={`Level 99 · ${top.name} Cape`}
              status={tp.isMaxLevel ? "Earned" : "Level 99"}
            />
            <SealedSlot title="Milestone unlocks" />
          </div>
        </GamePanel>
      </div>

      {/* ── Account row ──────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr]">
        <GamePanel as="section" labelledBy="chronicle" className="p-4 md:col-span-2 xl:col-span-1">
          <SectionHeader id="chronicle" icon={<PixelIcon name="diaries" size={22} />} title="Chronicle" divider />
          <ol className="flex flex-col pt-1">
            {chronicle.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2.5 border-b border-stone-800 py-2 last:border-0">
                <span aria-hidden className="size-1.5 shrink-0 rotate-45 bg-gold-400" />
                <span className="flex-1 text-text-primary">{entry.text}</span>
                <span className="shrink-0 text-sm text-text-muted">
                  <LocalDate iso={entry.createdAt} options={{ month: "short", day: "numeric" }} />
                </span>
              </li>
            ))}
          </ol>
        </GamePanel>

        <GamePanel as="section" labelledBy="world-diary" className="p-4">
          <SectionHeader id="world-diary" icon={<PixelIcon name="diaries" size={22} />} title="Achievement Diary" divider />
          <EmptyState
            icon={<PixelIcon name="diaries" size={40} className="opacity-60 grayscale" />}
            title="Not yet built"
            message="Weekly and Monthly Diaries with Easy, Medium, Hard, and Elite tiers arrive in a later update."
          />
        </GamePanel>

        <GamePanel as="section" labelledBy="world-collection" className="p-4">
          <SectionHeader id="world-collection" icon={<PixelIcon name="collection" size={22} />} title="Collection Log" divider />
          <EmptyState
            icon={<PixelIcon name="collection" size={40} className="opacity-60 grayscale" />}
            title="Not yet built"
            message="A museum of your meaningful accomplishments arrives in a later update."
          />
        </GamePanel>
      </div>
    </div>
  );
}
