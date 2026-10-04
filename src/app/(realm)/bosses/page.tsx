import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/art/PageBanner";
import { WorldVista } from "@/components/art/WorldVista";
import { BountyStatus } from "@/components/bosses/BountyStatus";
import { ChooseBoss } from "@/components/bosses/ChooseBoss";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { DifficultyBadge } from "@/components/quests/DifficultyBadge";
import { QuestDates } from "@/components/quests/QuestDates";
import { RewardTiles } from "@/components/quests/RewardTiles";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BOUNTY_TIER_LABELS, type BountyTier } from "@/game/bosses";
import { cx } from "@/lib/cx";
import { artUrl } from "@/server/art";
import { loadBossCandidates, loadCurrentBoss, loadDefeatedBosses } from "@/server/queries";

export const metadata: Metadata = { title: "Bosses" };

export default async function BossesPage() {
  const [boss, defeated, candidates] = await Promise.all([loadCurrentBoss(), loadDefeatedBosses(), loadBossCandidates()]);
  const sceneUrl = artUrl("bosses/scene");
  const others = candidates.filter((q) => q.id !== boss?.id);

  return (
    <>
      <PageBanner slot="bosses" title="Bosses" tagline="Take on your biggest challenges. Defeat them to earn a bounty." />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          {boss ? (
            <>
              <GamePanel as="section" labelledBy="boss-name" className="relative isolate overflow-hidden">
                <div aria-hidden className="absolute inset-0 -z-10">
                  {sceneUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sceneUrl} alt="" className="q-pixel h-full w-full object-cover" />
                  ) : (
                    <WorldVista />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-stone-900)_25%,rgb(17_23_32/0.55)_70%,rgb(106_29_22/0.35))]" />
                </div>
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:p-6">
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-sm border-2 border-crimson-500 bg-void/70 shadow-[0_0_24px_rgb(196_58_45/0.4)]">
                    <PixelIcon name="bosses" size={64} />
                  </div>
                  <div className="min-w-0 flex-1 md:max-w-[65%]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="crimson">Current Boss</Badge>
                      <DifficultyBadge difficulty={boss.difficulty} />
                      <span className="text-sm text-text-secondary">{boss.skillName}</span>
                    </div>
                    <h2 id="boss-name" className="q-title mt-1 text-display-md leading-tight text-gold-300 sm:text-display-lg">
                      {boss.title}
                    </h2>
                    {boss.description && <p className="mt-1 text-text-primary">{boss.description}</p>}
                    <div className="mt-2">
                      <QuestDates targetDate={boss.targetDate} deadline={boss.deadline} active />
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5 sm:px-6 md:max-w-[75%]">
                  <div className="flex items-center justify-between text-lg">
                    <span className="q-title text-text-primary">Boss HP</span>
                    <span className="font-bold tabular-nums text-crimson-300">{boss.hp}%</span>
                  </div>
                  <ProgressBar size="lg" tone="crimson" value={boss.hp} label="Boss HP" valueText={`${boss.hp}% HP remaining`} />
                  <p className="mt-1 text-text-secondary">
                    {boss.progress.total ? `${boss.progress.done} / ${boss.progress.total} phases cleared` : "Add objectives to break this Boss into phases."}
                  </p>
                  <GameLinkButton href={`/focus?quest=${boss.id}`} variant="primary" size="lg" className="mt-4 w-full sm:w-auto">
                    Enter Boss Fight →
                  </GameLinkButton>
                </div>
              </GamePanel>

              <GamePanel as="section" labelledBy="boss-phases" className="p-4">
                <SectionHeader
                  id="boss-phases"
                  icon={<PixelIcon name="combat" size={22} />}
                  title="Boss Phases"
                  divider
                  action={
                    <Link href={`/quests/${boss.id}`} className="text-sm text-blue-300 hover:underline">
                      Manage in Quest Journal →
                    </Link>
                  }
                />
                {boss.objectives.length === 0 ? (
                  <p className="mt-3 text-text-secondary">No phases yet.</p>
                ) : (
                  <ol className="mt-3 flex flex-col gap-1.5">
                    {boss.objectives.map((o, i) => {
                      const current = o.id === boss.progress.currentObjectiveId;
                      return (
                        <li key={o.id} className={cx("flex items-center gap-3 rounded-sm border px-3 py-2", current ? "border-blue-500 bg-stone-850" : "border-stone-700")}>
                          <span
                            aria-hidden
                            className={cx(
                              "flex size-7 items-center justify-center rounded-full border-2 text-sm",
                              o.done ? "border-moss-400 bg-moss-600 text-white" : current ? "border-blue-300" : "border-stone-500",
                            )}
                          >
                            {o.done ? "✓" : i + 1}
                          </span>
                          <span className={o.done ? "text-text-muted line-through" : "text-text-primary"}>
                            Phase {i + 1}: {o.title}
                          </span>
                          <span className="ml-auto text-xs font-bold uppercase tracking-wider text-text-muted">
                            {o.done ? "Cleared" : current ? "Current Phase" : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </GamePanel>
            </>
          ) : (
            <GamePanel className="p-6">
              <EmptyState
                icon={<PixelIcon name="bosses" size={64} className="opacity-60" />}
                title="No foe currently stands between you and your biggest goal"
                message="Choose your biggest active Quest as your Boss. Its HP falls as you clear objectives, and defeating it on time earns a bounty."
                action={others.length ? undefined : <GameLinkButton href="/quests/new" variant="primary">Create a Quest</GameLinkButton>}
              />
            </GamePanel>
          )}

          <GamePanel as="section" labelledBy="choose-boss" className="p-4">
            <SectionHeader id="choose-boss" icon={<PixelIcon name="bosses" size={22} />} title={boss ? "Change Boss" : "Choose a Boss"} divider />
            <p className="mt-2 text-sm text-text-muted">Only one Boss at a time. Master and Grandmaster Quests make worthy foes.</p>
            <ChooseBoss candidates={others} hasBoss={Boolean(boss)} />
          </GamePanel>
        </div>

        <div className="flex flex-col gap-4">
          {boss && (
            <>
              <GamePanel as="section" labelledBy="boss-rewards" className="p-4">
                <SectionHeader id="boss-rewards" icon={<PixelIcon name="gp" size={22} />} title="Rewards (Upon Defeat)" divider />
                <RewardTiles className="mt-3" rewards={boss.rewards} skillKey={boss.skillKey} skillName={boss.skillName} />
              </GamePanel>
              <GamePanel as="section" labelledBy="boss-bounty" className="p-4">
                <SectionHeader id="boss-bounty" icon={<PixelIcon name="gp" size={22} />} title="Bounty" divider />
                <div className="mt-3">
                  <BountyStatus bounty={boss.bounty} targetDate={boss.targetDate} deadline={boss.deadline} />
                </div>
              </GamePanel>
            </>
          )}
          <GamePanel as="section" labelledBy="boss-hall" className="p-4">
            <SectionHeader id="boss-hall" icon={<PixelIcon name="total-level" size={22} />} title="Bosses Defeated" divider action={<span className="text-sm text-text-secondary">{defeated.length}</span>} />
            {defeated.length === 0 ? (
              <p className="mt-3 text-sm text-text-secondary">No Bosses defeated yet. Your first victory will be recorded here forever.</p>
            ) : (
              <ul className="mt-2">
                {defeated.map((d) => (
                  <li key={d.id + d.completedAt} className="flex items-center gap-2 border-b border-stone-800 py-2 last:border-0">
                    <SkillIcon icon="bosses" size={20} framed={false} />
                    <Link href={`/quests/${d.id}`} className="flex-1 truncate text-text-primary hover:underline">
                      {d.title}
                    </Link>
                    <span className="text-xs text-text-muted">
                      {d.completedAt && <LocalDate iso={d.completedAt} options={{ month: "short", day: "numeric" }} />}
                      {d.bountyGp > 0 && ` · +${d.bountyGp} GP`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-text-muted">
              Bounty tiers: {(["EARLY", "BY_TARGET", "BY_DEADLINE", "LATE"] as BountyTier[]).map((t) => BOUNTY_TIER_LABELS[t]).join(" · ")}
            </p>
          </GamePanel>
        </div>
      </div>
    </>
  );
}
