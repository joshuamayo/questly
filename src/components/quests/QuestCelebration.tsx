"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { skillColor } from "@/components/skills/skill-style";
import { GameButton } from "@/components/ui/GameButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BOUNTY_TIER_LABELS } from "@/game/bosses";
import { formatNumber } from "@/lib/format";
import type { CelebrationLevelUp, CompletionPayload } from "@/app/(realm)/quests/actions";
import { RewardTiles } from "./RewardTiles";

/**
 * Quest Complete sequence. The Quest's rewards, any Boss bounty, Level Ups,
 * a Questline completion, and newly available Quests are composed into one
 * reveal rather than stacked modals (CLAUDE.md §21). Fast, skippable
 * (Escape / Continue), and focus-managed.
 */
export function QuestCelebration({ payload, onClose }: { payload: CompletionPayload | null; onClose: () => void }) {
  const boss = payload?.boss;
  const meta = payload?.meta;
  const hasSide = Boolean(
    payload && (payload.levelUps.length || payload.questline || payload.unlocked.length || meta?.achievements.length || meta?.collection.length || meta?.titles.length),
  );
  return (
    <Dialog.Root open={Boolean(payload)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-void/85 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(94vw,58rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto focus:outline-none lg:flex-row lg:items-start"
          aria-describedby="celebration-desc"
        >
          {payload && (
            <>
              <section className="q-parchment q-frame-gold q-enter flex-1 p-6 text-center sm:p-8">
                <div
                  aria-hidden
                  className={
                    boss
                      ? "mx-auto -mt-2 flex size-16 items-center justify-center rounded-full border-4 border-crimson-500 bg-crimson-300/40 shadow-[0_0_24px_rgb(228_90_76/0.6)]"
                      : "mx-auto -mt-2 flex size-16 items-center justify-center rounded-full border-4 border-gold-500 bg-gold-200/60 shadow-[0_0_24px_rgb(219_167_63/0.6)]"
                  }
                >
                  {boss ? <PixelIcon name="bosses" size={36} /> : <SkillIcon icon={payload.skillIcon} size={34} framed={false} />}
                </div>
                <Dialog.Title className="q-title mt-3 text-display-lg leading-none text-parchment-ink sm:text-display-xl">
                  {boss ? "Boss Defeated!" : "Quest Complete!"}
                </Dialog.Title>
                <p className="q-title mt-1 text-2xl text-parchment-ink">{payload.quest.title}</p>
                <p id="celebration-desc" className="mt-2 text-parchment-ink-soft">
                  {payload.duplicate
                    ? "This Quest was already complete. Its rewards were given once and are not given again."
                    : boss
                      ? "Your greatest challenge has fallen. This one will be remembered."
                      : "Your work is done and your account grows stronger."}
                </p>
                <div className="q-rule mx-auto my-4 w-2/3" />
                <p className="q-title text-xl text-parchment-ink">Rewards</p>
                <RewardTiles
                  className="mt-2"
                  tone="parchment"
                  earned
                  rewards={payload.rewards}
                  skillKey={payload.quest.skillKey}
                  skillName={payload.skillName}
                />
                {boss && (
                  <p className="mt-3 rounded-sm border border-crimson-500/60 bg-crimson-300/20 px-3 py-2 text-parchment-ink">
                    {boss.bountyGp > 0 ? (
                      <>
                        <span className="font-bold">Boss Bounty: +{boss.bountyGp} GP</span> ({BOUNTY_TIER_LABELS[boss.tier]})
                      </>
                    ) : (
                      <>No bounty this time ({BOUNTY_TIER_LABELS[boss.tier]}). Your normal rewards are untouched.</>
                    )}
                  </p>
                )}
                <p className="mt-3 text-sm text-parchment-ink-soft">
                  Total Level {payload.totals.totalLevelAfter} · {formatNumber(payload.totals.questPoints)} Quest Points ·{" "}
                  {formatNumber(payload.totals.gpBalance)} GP
                </p>
                <Dialog.Close asChild>
                  <GameButton variant="primary" size="lg" className="mt-5 min-w-48">
                    Continue →
                  </GameButton>
                </Dialog.Close>
              </section>

              {hasSide && (
                <div className="flex flex-col gap-4 lg:w-80">
                  {payload.levelUps.map((l, i) => (
                    <LevelUpCard key={l.skillKey} levelUp={l} delay={150 + i * 120} totals={i === 0 ? payload.totals : null} />
                  ))}
                  {payload.questline && (
                    <section aria-label="Questline Complete" className="q-stone q-frame-gold q-enter flex flex-col gap-2 p-5" style={{ animationDelay: "300ms" }}>
                      <p className="q-title flex items-center gap-2 text-2xl text-gold-300">
                        <PixelIcon name="questlines" size={24} /> Questline Complete!
                      </p>
                      <p className="q-title text-xl text-text-primary">{payload.questline.title}</p>
                      <p className="text-text-secondary">
                        Completion bonus: +{formatNumber(payload.questline.bonusXp)} XP and +{payload.questline.bonusGp} GP.
                      </p>
                    </section>
                  )}
                  {meta && meta.collection.length > 0 && (
                    <section aria-label="Collection Item Obtained" className="q-stone q-frame-gold q-enter flex flex-col gap-2 p-5" style={{ animationDelay: "350ms" }}>
                      <p className="q-title flex items-center gap-2 text-2xl text-gold-300">
                        <PixelIcon name="collection" size={24} /> New Collection Log Item!
                      </p>
                      <ul className="flex flex-col gap-2">
                        {meta.collection.map((c) => (
                          <li key={c.key} className="flex items-center gap-3">
                            <SkillIcon icon={c.icon} size={32} />
                            <span>
                              <span className="block text-text-primary">{c.title}</span>
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: `var(--color-rarity-${c.rarity.toLowerCase()})` }}>
                                {c.rarity.toLowerCase()}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {meta && meta.achievements.length > 0 && (
                    <section aria-label="Combat Achievement Complete" className="q-stone q-frame q-enter flex flex-col gap-2 p-5" style={{ animationDelay: "380ms" }}>
                      <p className="q-title flex items-center gap-2 text-2xl text-gold-300">
                        <PixelIcon name="combat-points" size={24} /> Achievement Unlocked!
                      </p>
                      <ul className="flex flex-col gap-1">
                        {meta.achievements.map((a) => (
                          <li key={a.key} className="flex items-center justify-between gap-2 text-text-primary">
                            <span>
                              {a.title} <span className="text-xs text-text-muted">({a.tier.toLowerCase()})</span>
                            </span>
                            <span className="font-bold text-gold-200">+{a.combatPoints} CP</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {meta && meta.titles.length > 0 && (
                    <section aria-label="Title Unlocked" className="q-stone q-frame q-enter p-5" style={{ animationDelay: "400ms" }}>
                      <p className="q-title text-xl text-gold-300">Title Unlocked</p>
                      <p className="text-text-primary">{meta.titles.map((t) => t.name).join(", ")} — equip it from your Character Profile.</p>
                    </section>
                  )}
                  {payload.unlocked.length > 0 && (
                    <section aria-label="New Quest Available" className="q-stone q-frame q-enter flex flex-col gap-2 p-5" style={{ animationDelay: "400ms" }}>
                      <p className="q-title flex items-center gap-2 text-2xl text-blue-300">
                        <PixelIcon name="quests" size={24} /> New Quest Available
                      </p>
                      <ul className="flex flex-col gap-1">
                        {payload.unlocked.map((u) => (
                          <li key={u.id}>
                            <Link href={`/quests/${u.id}`} className="text-text-primary underline-offset-4 hover:underline" onClick={onClose}>
                              {u.title} →
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LevelUpCard({
  levelUp,
  delay,
  totals,
}: {
  levelUp: CelebrationLevelUp;
  delay: number;
  totals: CompletionPayload["totals"] | null;
}) {
  return (
    <section aria-label={`Level Up: ${levelUp.skillName}`} className="q-stone q-frame-gold q-enter flex flex-col gap-3 p-5" style={{ animationDelay: `${delay}ms` }}>
      <p className="q-title flex items-center gap-2 text-3xl text-gold-300">
        <PixelIcon name="total-level" size={28} /> Level Up!
      </p>
      <div className="flex items-center gap-3">
        <SkillIcon icon={levelUp.skillIcon} size={44} />
        <div>
          <p className="q-title text-2xl text-text-primary">{levelUp.skillName}</p>
          <p className="q-title text-xl" style={{ color: skillColor(levelUp.skillKey) }}>
            Level {levelUp.fromLevel} → {levelUp.toLevel}
          </p>
        </div>
      </div>
      {levelUp.levelsReached.length > 1 && <p className="text-text-secondary">{levelUp.levelsReached.length} levels gained at once!</p>}
      <ProgressBar
        color={skillColor(levelUp.skillKey)}
        value={levelUp.progress.percentToNext}
        label={`${levelUp.skillName} progress to next level`}
        valueText={levelUp.progress.isMaxLevel ? "Maximum level" : `${formatNumber(levelUp.progress.xpRemaining)} XP to Level ${levelUp.progress.level + 1}`}
      />
      <p className="text-sm text-text-muted">
        {levelUp.progress.isMaxLevel
          ? "Level 99 — the Skill Cape is yours."
          : `${formatNumber(levelUp.progress.xpRemaining)} XP to Level ${levelUp.progress.level + 1}`}
      </p>
      {totals && (
        <p className="text-sm text-text-secondary">
          Total Level {totals.totalLevelBefore} → {totals.totalLevelAfter}
        </p>
      )}
    </section>
  );
}
