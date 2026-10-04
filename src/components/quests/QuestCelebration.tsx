"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { skillColor } from "@/components/skills/skill-style";
import { GameButton } from "@/components/ui/GameButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatNumber } from "@/lib/format";
import type { CompletionPayload } from "@/app/(realm)/quests/actions";
import { RewardTiles } from "./RewardTiles";

/**
 * Quest Complete sequence. Quest rewards and any Level Up are composed into
 * one reveal rather than stacked modals (CLAUDE.md §21). Fast, skippable
 * (Escape / Continue), and focus-managed.
 */
export function QuestCelebration({ payload, onClose }: { payload: CompletionPayload | null; onClose: () => void }) {
  const level = payload?.levelUp;
  return (
    <Dialog.Root open={Boolean(payload)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-void/85 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(94vw,56rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto focus:outline-none lg:flex-row lg:items-start"
          aria-describedby="celebration-desc"
        >
          {payload && (
            <>
              <section className="q-parchment q-frame-gold q-enter flex-1 p-6 text-center sm:p-8">
                <div aria-hidden className="mx-auto -mt-2 flex size-16 items-center justify-center rounded-full border-4 border-gold-500 bg-gold-200/60 shadow-[0_0_24px_rgb(219_167_63/0.6)]">
                  <SkillIcon icon={payload.skillIcon} size={34} framed={false} />
                </div>
                <Dialog.Title className="q-title mt-3 text-display-lg leading-none text-parchment-ink sm:text-display-xl">
                  Quest Complete!
                </Dialog.Title>
                <p className="q-title mt-1 text-2xl text-parchment-ink">{payload.quest.title}</p>
                <p id="celebration-desc" className="mt-2 text-parchment-ink-soft">
                  {payload.duplicate
                    ? "This Quest was already complete. Its rewards were given once and are not given again."
                    : "Your work is done and your account grows stronger."}
                </p>
                <div className="q-rule mx-auto my-4 w-2/3" />
                <p className="q-title text-xl text-parchment-ink">Rewards</p>
                <RewardTiles className="mt-2" tone="parchment" earned rewards={payload.rewards} skillKey={payload.quest.skillKey} skillName={payload.skillName} />
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

              {level && (
                <section
                  aria-label="Level Up"
                  className="q-stone q-frame-gold q-enter flex flex-col gap-3 p-6 lg:w-80"
                  style={{ animationDelay: "150ms" }}
                >
                  <p className="q-title flex items-center gap-2 text-3xl text-gold-300">
                    <PixelIcon name="total-level" size={28} /> Level Up!
                  </p>
                  <div className="flex items-center gap-3">
                    <SkillIcon icon={payload.skillIcon} size={48} />
                    <div>
                      <p className="q-title text-2xl text-text-primary">{payload.skillName}</p>
                      <p className="q-title text-xl" style={{ color: skillColor(level.skillKey) }}>
                        Level {level.fromLevel} → {level.toLevel}
                      </p>
                    </div>
                  </div>
                  {level.levelsReached.length > 1 && (
                    <p className="text-text-secondary">{level.levelsReached.length} levels gained at once!</p>
                  )}
                  <ProgressBar
                    color={skillColor(level.skillKey)}
                    value={payload.skillProgress.percentToNext}
                    label={`${payload.skillName} progress to next level`}
                    valueText={
                      payload.skillProgress.isMaxLevel
                        ? "Maximum level"
                        : `${formatNumber(payload.skillProgress.xpRemaining)} XP to Level ${payload.skillProgress.level + 1}`
                    }
                  />
                  <p className="text-sm text-text-muted">
                    {payload.skillProgress.isMaxLevel
                      ? "Level 99 — the Skill Cape is yours."
                      : `${formatNumber(payload.skillProgress.xpRemaining)} XP to Level ${payload.skillProgress.level + 1}`}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Total Level {payload.totals.totalLevelBefore} → {payload.totals.totalLevelAfter}
                  </p>
                </section>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
