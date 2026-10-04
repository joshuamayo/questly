import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/art/PageBanner";
import { CharacterFull } from "@/components/character/CharacterArt";
import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { skillColor } from "@/components/skills/skill-style";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { totalLevelMilestones } from "@/game/character";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { artUrl } from "@/server/art";
import {
  loadCharacterSheet,
  loadCollection,
  loadCombatAchievements,
  loadCurrentBoss,
  loadDefeatedBosses,
  loadDiaryHistory,
  loadFocusStats,
  loadQuestCounts,
  loadQuests,
  loadTitlesAndCapes,
  loadStreaks,
  loadRespawnStats,
} from "@/server/queries";
import { EquipPanel } from "@/components/character/EquipPanel";
import { QuestCard } from "@/components/quests/QuestCard";

export const metadata: Metadata = { title: "Character" };

function StatTile({ icon, label, value }: { icon: SpriteName; label: string; value: number }) {
  return (
    <div className="q-tile flex flex-col items-center gap-1 px-2 py-3 text-center">
      <PixelIcon name={icon} size={36} />
      <dd className="q-title text-2xl leading-none tabular-nums text-text-primary">{formatNumber(value)}</dd>
      <dt className="text-sm text-text-secondary">{label}</dt>
    </div>
  );
}

export default async function CharacterPage() {
  const [sheet, counts, active, boss, defeated, focus] = await Promise.all([
    loadCharacterSheet(),
    loadQuestCounts(),
    loadQuests("active"),
    loadCurrentBoss(),
    loadDefeatedBosses(),
    loadFocusStats(),
  ]);
  const [collection, achievements, diaryClaims, cosmetics, streaks, resilience] = await Promise.all([
    loadCollection(),
    loadCombatAchievements(),
    loadDiaryHistory(),
    loadTitlesAndCapes(),
    loadStreaks(),
    loadRespawnStats(),
  ]);
  const owned = collection.filter((c) => c.state === "UNLOCKED");
  const rarityRank = ["LEGENDARY", "EPIC", "RARE", "UNCOMMON", "COMMON"];
  const significant = [...owned].sort((a, b) => rarityRank.indexOf(a.rarity) - rarityRank.indexOf(b.rarity)).slice(0, 5);
  const recentItems = [...owned].sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? "")).slice(0, 6);
  const milestones = totalLevelMilestones(sheet.totalLevel);
  const totalPct = (sheet.totalLevel / sheet.maxTotalLevel) * 100;

  return (
    <>
      <PageBanner slot="character" title="Character Profile" tagline="Your progress, honors, and journey at a glance." />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          {/* ── Identity ─────────────────────────────────────────────── */}
          <GamePanel as="section" labelledBy="char-name" className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="flex shrink-0 items-end justify-center border-b border-stone-700 bg-[radial-gradient(ellipse_at_50%_35%,var(--color-stone-800),var(--color-void))] px-6 pt-5 md:w-60 md:border-b-0 md:border-r">
                <CharacterFull avatar={sheet.avatar} name={sheet.displayName} url={artUrl("character/full")} height={250} />
              </div>
              <div className="flex-1 p-5">
                <div className="flex flex-col gap-4">
                  <div className="min-w-0">
                    <h2 id="char-name" className="q-title q-engraved text-display-md">
                      {sheet.displayName}
                    </h2>
                    <p className="q-title text-xl text-gold-200">Total Level {sheet.totalLevel}</p>
                    <ProgressBar
                      tone="gold"
                      className="mt-1"
                      value={totalPct}
                      label="Total Level toward maximum"
                      valueText={`${sheet.totalLevel} of ${sheet.maxTotalLevel}`}
                    />
                    <p className="mt-1 text-sm text-text-secondary">
                      {sheet.totalLevel} / {sheet.maxTotalLevel}
                    </p>
                    <p className="mt-3 text-sm text-text-secondary">
                      Adventuring since <LocalDate iso={sheet.createdAt} />
                      <br />
                      {sheet.accountAge} · Day {formatNumber(sheet.adventureDay)}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatTile icon="qp" label="Quest Points" value={sheet.questPoints} />
                    <StatTile icon="combat-points" label="Combat Points" value={sheet.combatPoints} />
                    <StatTile icon="gp" label="GP" value={sheet.gp.balance} />
                    <StatTile icon="collection" label={`Collection (${collection.length})`} value={owned.length} />
                  </dl>
                </div>
                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="q-tile px-3 py-2">
                    <dt className="text-sm text-gold-300">Current Title</dt>
                    <dd className="font-bold text-text-primary">{sheet.title?.name ?? "None"}</dd>
                  </div>
                  <div className="q-tile px-3 py-2">
                    <dt className="text-sm text-gold-300">Current Cape</dt>
                    <dd className="font-bold text-text-primary">
                      {sheet.cape?.name ?? "None"}
                      {!sheet.cape && <span className="ml-2 text-sm font-normal text-text-muted">Skill Capes are earned at Level 99</span>}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </GamePanel>

          <EquipPanel titles={cosmetics.titles} capes={cosmetics.capes} equippedTitle={sheet.title?.key ?? null} equippedCape={sheet.cape?.key ?? null} />

          {significant.length > 0 && (
            <GamePanel as="section" labelledBy="char-significant" className="p-4">
              <SectionHeader id="char-significant" icon={<PixelIcon name="total-level" size={22} />} title="Significant Achievements" divider />
              <ul className="mt-3 flex flex-wrap gap-3">
                {significant.map((c) => (
                  <li key={c.key} className="flex w-24 flex-col items-center gap-1 text-center">
                    <SkillIcon icon={c.icon} size={36} />
                    <span className="text-xs text-text-primary">{c.title}</span>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: `var(--color-rarity-${c.rarity.toLowerCase()})` }}>
                      {c.rarity.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </GamePanel>
          )}

          {/* ── Skills ───────────────────────────────────────────────── */}
          <GamePanel as="section" labelledBy="char-skills" className="p-4">
            <SectionHeader
              id="char-skills"
              icon={<PixelIcon name="skills" size={22} />}
              title="Skills"
              divider
              action={
                <Link href="/skills" className="text-sm text-blue-300 hover:underline">
                  View All →
                </Link>
              }
            />
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sheet.skills.map((s) => (
                <li key={s.key}>
                  <Link href={`/skills?skill=${s.key}`} className="q-tile flex items-center gap-3 p-3 hover:border-gold-600">
                    <SkillIcon icon={s.icon} size={34} framed={false} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-text-primary">{s.name}</span>
                      <span className="block text-sm font-bold" style={{ color: skillColor(s.key) }}>
                        {s.progress.level} <span className="text-text-muted">/ 99</span>
                      </span>
                      <ProgressBar
                        size="sm"
                        color={skillColor(s.key)}
                        value={s.progress.percentToNext}
                        label={`${s.name} progress`}
                        valueText={`Level ${s.progress.level}, ${s.progress.percentToNext}% to next`}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </GamePanel>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-[1.4fr_1fr_1fr]">
            <GamePanel as="section" labelledBy="char-quests" className="p-4">
              <SectionHeader
                id="char-quests"
                icon={<PixelIcon name="quests" size={22} />}
                title="Active Quests"
                divider
                action={
                  <Link href="/quests" className="text-sm text-blue-300 hover:underline">
                    View All →
                  </Link>
                }
              />
              {active.length ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {active.slice(0, 2).map((q) => (
                    <li key={q.id}>
                      <QuestCard quest={q} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">
                  No active Quests.{" "}
                  <Link href="/quests/new" className="text-blue-300 hover:underline">
                    Create one
                  </Link>
                </p>
              )}
            </GamePanel>
            <GamePanel as="section" labelledBy="char-boss" className="p-4">
              <SectionHeader id="char-boss" icon={<PixelIcon name="bosses" size={22} />} title="Current Boss" divider />
              {boss ? (
                <Link href="/bosses" className="mt-3 block">
                  <p className="q-title text-lg text-text-primary">{boss.title}</p>
                  <ProgressBar className="mt-1" tone="crimson" value={boss.hp} label="Boss HP" valueText={`${boss.hp}% HP`} />
                  <p className="text-sm text-text-muted">{boss.hp}% HP remaining</p>
                </Link>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">
                  No Current Boss.{" "}
                  <Link href="/bosses" className="text-blue-300 hover:underline">
                    Choose one
                  </Link>
                </p>
              )}
            </GamePanel>
            <GamePanel as="section" labelledBy="char-collection" className="p-4">
              <SectionHeader
                id="char-collection"
                icon={<PixelIcon name="collection" size={22} />}
                title="Collection Log"
                divider
                action={
                  <Link href="/collection-log" className="text-sm text-blue-300 hover:underline">
                    View All →
                  </Link>
                }
              />
              {recentItems.length ? (
                <ul className="mt-3 grid grid-cols-3 gap-2">
                  {recentItems.map((c) => (
                    <li key={c.key} className="q-tile flex flex-col items-center gap-1 p-2 text-center" title={c.title}>
                      <SkillIcon icon={c.icon} size={26} framed={false} />
                      <span className="line-clamp-1 text-xs text-text-secondary">{c.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">Nothing discovered here yet.</p>
              )}
              <p className="mt-2 text-sm text-text-muted">
                {owned.length} / {collection.length} items ({Math.floor((owned.length / collection.length) * 100)}%)
              </p>
            </GamePanel>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <GamePanel as="section" labelledBy="char-total" className="p-4">
            <SectionHeader id="char-total" icon={<PixelIcon name="total-level" size={22} />} title="Total Level" divider />
            <p className="q-title mt-2 text-6xl leading-none text-text-primary">{sheet.totalLevel}</p>
            <ProgressBar
              tone="gold"
              size="lg"
              className="mt-3"
              value={totalPct}
              label="Total Level toward maximum"
              valueText={`${sheet.totalLevel} of ${sheet.maxTotalLevel}`}
            />
            <p className="mt-1 text-text-secondary">
              {sheet.totalLevel} / {sheet.maxTotalLevel} ({Math.floor(totalPct)}%)
            </p>
          </GamePanel>

          <GamePanel as="section" labelledBy="char-milestones" className="p-4">
            <SectionHeader id="char-milestones" icon={<PixelIcon name="skills" size={22} />} title="Level Milestones" divider />
            <ul className="mt-2">
              {milestones.map((m) => (
                <li key={m.level} className="flex items-center gap-3 border-b border-stone-800 py-2 last:border-0">
                  <span
                    aria-hidden
                    className={cx(
                      "flex size-6 items-center justify-center rounded-full border-2 text-xs",
                      m.reached ? "border-moss-400 bg-moss-600 text-white" : "border-stone-500",
                    )}
                  >
                    {m.reached ? "✓" : ""}
                  </span>
                  <span className="flex-1 text-text-primary">
                    Total Level {m.level}
                    {m.level === sheet.maxTotalLevel && <span className="text-text-muted"> (maximum)</span>}
                  </span>
                  <span className={cx("text-sm", m.reached ? "text-moss-300" : "text-text-muted")}>
                    {m.reached ? "Reached" : "Not yet"}
                  </span>
                </li>
              ))}
            </ul>
          </GamePanel>

          <GamePanel as="section" labelledBy="char-streaks" className="p-4">
            <SectionHeader id="char-streaks" icon={<PixelIcon name="sword" size={22} />} title="Streaks" divider />
            <dl className="mt-2">
              {(
                [
                  ["Adventure Streak", streaks.adventure.current, streaks.adventure.best],
                  ["Focus Streak", streaks.focus.current, streaks.focus.best],
                  ["Deadline Streak", streaks.deadline.current, streaks.deadline.best],
                ] as const
              ).map(([label, current, best]) => (
                <div key={label} className="flex justify-between border-b border-stone-800 py-2">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="tabular-nums text-text-primary">
                    <span className="font-bold">{current}</span> <span className="text-sm text-text-muted">· best {best}</span>
                  </dd>
                </div>
              ))}
              <div className="flex justify-between border-b border-stone-800 py-2">
                <dt className="text-text-secondary">Streak Shields</dt>
                <dd className="font-bold tabular-nums text-blue-300">
                  {streaks.shields} / {streaks.maxShields}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-text-secondary">Deaths · Respawns</dt>
                <dd className="font-bold tabular-nums text-text-primary">
                  {resilience.deaths} · {resilience.respawns}
                </dd>
              </div>
            </dl>
            <p className="mt-1 text-xs text-text-muted">
              {resilience.respawns > 0 ? `Came back ${resilience.respawns} time${resilience.respawns === 1 ? "" : "s"}. That is resilience.` : "Shields come from Weekly Elite and Monthly Hard/Elite Diary tiers."}
            </p>
          </GamePanel>

          <GamePanel as="section" labelledBy="char-lifetime" className="p-4">
            <SectionHeader id="char-lifetime" icon={<PixelIcon name="diaries" size={22} />} title="Lifetime Stats" divider />
            <dl className="mt-2">
              {[
                ["Quests completed", counts.completed],
                ["Combat Achievements", achievements.filter((a) => a.completedAt).length],
                ["Diary tiers claimed", diaryClaims.length],
                ["Collection items", owned.length],
                ["Bosses defeated", defeated.length],
                ["Focus sessions", focus.sessions],
                ["Focus minutes", focus.minutes],
                ["Total XP", sheet.totalXp],
                ["GP earned", sheet.gp.lifetimeEarned],
                ["GP spent", sheet.gp.lifetimeSpent],
                ["Days adventuring", sheet.adventureDay],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-stone-800 py-2 last:border-0">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="font-bold tabular-nums text-text-primary">{formatNumber(value as number)}</dd>
                </div>
              ))}
            </dl>

          </GamePanel>
        </div>
      </div>
    </>
  );
}
