"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { beginRespawnAction, chooseRespawnQuestAction, completeRespawnAction } from "@/app/(realm)/respawn/actions";
import { setQuestPriorityAction } from "@/app/(realm)/quests/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { ContinueDialog, NeedsAttention, type AttentionView } from "@/components/planning/NeedsAttention";
import { DifficultyBadge } from "@/components/quests/DifficultyBadge";
import { Badge } from "@/components/ui/Badge";
import { GameButton, GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { cx } from "@/lib/cx";
import { formatIsoDate } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { useAction } from "@/lib/use-action";
import type { QuestSummary } from "@/server/queries";

type Trigger = "MANUAL" | "MISSED_WORKDAYS" | "QUESTS_NEED_ATTENTION";

const STEPS: { title: string; icon: SpriteName }[] = [
  { title: "Review & Decide", icon: "quests" },
  { title: "Reset Targets", icon: "diaries" },
  { title: "Choose a Respawn Quest", icon: "sword" },
  { title: "Lighten the Load", icon: "character" },
  { title: "Re-enter the World", icon: "world" },
];

/**
 * Respawn (Product Spec §23): "You Died" is playful framing, immediately
 * followed by "Nothing permanent was lost." A guided recovery, never a penalty.
 */
export function RespawnFlow({
  today,
  started,
  trigger,
  recoveryDays,
  comebackXp,
  permanent,
  attention,
  active,
}: {
  today: string;
  started: boolean;
  trigger: Trigger;
  recoveryDays: number;
  comebackXp: number;
  permanent: { totalLevel: number; questPoints: number; combatPoints: number; gp: number; collection: number };
  attention: AttentionView[];
  active: QuestSummary[];
}) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const [step, setStep] = useState(started ? 0 : -1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const go = (i: number) => {
    setStep(i);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  if (step === -1) {
    return (
      <GamePanel as="section" aria-labelledby="you-died" className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-6 text-center sm:p-10">
        <p id="you-died" className="q-title text-[3.5rem] leading-none text-crimson-300 drop-shadow-[0_0_18px_rgb(228_90_76/0.45)] sm:text-[4.5rem]">
          YOU DIED
        </p>
        <p className="q-title text-2xl text-gold-200">Nothing permanent was lost.</p>
        <p className="max-w-lg text-text-secondary">
          {trigger === "MISSED_WORKDAYS"
            ? "A few adventuring days slipped by. It happens to every adventurer."
            : trigger === "QUESTS_NEED_ATTENTION"
              ? "Several Quests have drifted past their dates. Time to clear the path."
              : "Sometimes the best move is a fresh start."}{" "}
          Your levels, XP, GP, Quest Points, Combat Points, achievements, and Collection Log are all exactly as you left them.
        </p>
        <ul className="grid w-full grid-cols-2 gap-2 sm:grid-cols-5">
          {(
            [
              ["Total Level", permanent.totalLevel, "total-level"],
              ["Quest Points", permanent.questPoints, "qp"],
              ["Combat Points", permanent.combatPoints, "combat-points"],
              ["GP", permanent.gp, "gp"],
              ["Collection", permanent.collection, "collection"],
            ] as const
          ).map(([label, value, icon]) => (
            <li key={label} className="q-well flex flex-col items-center gap-1 border border-border-dark p-2">
              <PixelIcon name={icon} size={24} />
              <span className="q-title text-xl tabular-nums text-gold-200">{formatNumber(value)}</span>
              <span className="text-xs text-text-muted">{label}</span>
              <span className="text-[0.65rem] uppercase tracking-wider text-moss-300">✓ Safe</span>
            </li>
          ))}
        </ul>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap justify-center gap-2">
          <GameButton variant="primary" size="lg" disabled={pending} onClick={() => run(() => beginRespawnAction(trigger), () => go(0))}>
            Respawn
          </GameButton>
          <GameLinkButton href="/" size="lg">
            Not now
          </GameLinkButton>
        </div>
      </GamePanel>
    );
  }

  const s = STEPS[step];
  const respawnQuest = active.find((q) => q.isRespawnQuest && q.status !== "ON_HOLD");
  const mains = active.filter((q) => q.priority === "MAIN");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <ol className="flex gap-1 overflow-x-auto" aria-label="Respawn steps">
        {STEPS.map((st, i) => (
          <li key={st.title} className="shrink-0">
            <button
              type="button"
              aria-current={i === step ? "step" : undefined}
              onClick={() => go(i)}
              className={cx(
                "flex min-h-10 items-center gap-2 rounded-sm border px-2.5 text-sm",
                i === step ? "border-gold-500 bg-gold-700/25 text-gold-100" : "border-stone-700 text-text-secondary hover:border-stone-500",
              )}
            >
              <span className="inline-flex size-5 items-center justify-center rounded-full border border-stone-500 text-xs">{i < step ? "✓" : i + 1}</span>
              <span className={cx(i !== step && "sr-only sm:not-sr-only")}>{st.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <GamePanel as="section" aria-labelledby="respawn-step" className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-2.5">
          <PixelIcon name={s.icon} size={26} />
          <h1 id="respawn-step" ref={headingRef} tabIndex={-1} className="q-title text-display-md leading-tight text-gold-300 focus:outline-none">
            {s.title}
          </h1>
        </div>
        {error && <Notice tone="error">{error}</Notice>}

        {step === 0 &&
          (attention.length ? (
            <>
              <p className="text-text-secondary">These Quests drifted past their dates. Decide each one: keep it with a new target, rescope it, or let it go. Abandoning gives no rewards but keeps its history.</p>
              <NeedsAttention items={attention} today={today} reason="RESPAWN" heading={false} />
            </>
          ) : (
            <p className="text-text-secondary">No Quests need attention. The path is already clear.</p>
          ))}

        {step === 1 && <ResetTargets active={active} today={today} />}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-text-secondary">
              Pick one Quest to restart your momentum — small and clearly winnable is perfect. Completing it grants a +{comebackXp} Focus XP comeback bonus.
            </p>
            {active.filter((q) => q.status !== "ON_HOLD").length === 0 ? (
              <div className="flex flex-col items-start gap-2">
                <p className="text-text-secondary">You have no active Quests. Accept a small one, then come back to choose it.</p>
                <GameLinkButton href="/quests/board">Visit the Quest Board</GameLinkButton>
              </div>
            ) : (
              <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Respawn Quest">
                {active
                  .filter((q) => q.status !== "ON_HOLD")
                  .map((q) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={q.isRespawnQuest}
                        disabled={pending}
                        onClick={() => run(() => chooseRespawnQuestAction(q.id), () => router.refresh())}
                        className={cx(
                          "flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left",
                          q.isRespawnQuest ? "border-gold-500 bg-gold-700/25" : "border-stone-700 hover:border-stone-500",
                        )}
                      >
                        <span aria-hidden className="text-gold-300">{q.isRespawnQuest ? "◉" : "○"}</span>
                        <SkillIcon icon={q.icon} size={24} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-text-primary">{q.title}</span>
                          <span className="text-xs text-text-muted">
                            {q.progress.total > 0 ? `${q.progress.total - q.progress.done} objective${q.progress.total - q.progress.done === 1 ? "" : "s"} left` : "No objectives"}
                          </span>
                        </span>
                        <DifficultyBadge difficulty={q.difficulty} />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="text-text-secondary">
              For the next {recoveryDays} days, the World will recommend just one Quest at a time. Consider keeping a single Main Quest — the rest can wait as Side Quests.
            </p>
            {mains.length === 0 ? (
              <p className="text-text-secondary">No Main Quests right now. A light load already.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {mains.map((q) => (
                  <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-stone-700 px-3 py-2">
                    <SkillIcon icon={q.icon} size={24} />
                    <span className="min-w-0 flex-1 truncate text-text-primary">{q.title}</span>
                    {q.isRespawnQuest && <Badge tone="gold">Respawn Quest</Badge>}
                    <GameButton size="sm" disabled={pending} onClick={() => run(() => setQuestPriorityAction(q.id, "SIDE"), () => router.refresh())}>
                      Make Side Quest
                    </GameButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-start gap-3">
            {respawnQuest ? (
              <p className="text-text-secondary">
                Your Respawn Quest: <span className="font-bold text-text-primary">{respawnQuest.title}</span>. One clear win, and the adventure rolls on.
              </p>
            ) : (
              <Notice>Choose a Respawn Quest first (step 3).</Notice>
            )}
            <GameButton
              variant="primary"
              size="lg"
              disabled={pending || !respawnQuest}
              onClick={() => run(() => completeRespawnAction(), () => router.push("/?respawned=1"))}
            >
              Re-enter the World
            </GameButton>
          </div>
        )}

        <div className="mt-2 flex justify-between gap-2 border-t border-stone-700 pt-4">
          <GameButton disabled={step === 0} onClick={() => go(step - 1)}>
            ← Back
          </GameButton>
          {step < STEPS.length - 1 && (
            <GameButton variant="primary" onClick={() => go(step + 1)}>
              Next →
            </GameButton>
          )}
        </div>
      </GamePanel>
    </div>
  );
}

function ResetTargets({ active, today }: { active: QuestSummary[]; today: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<QuestSummary | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-secondary">Look at your remaining Quests and give each a target you can actually hit. Original dates stay in each Quest&apos;s history.</p>
      {active.length === 0 ? (
        <p className="text-text-secondary">No active Quests.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {active.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-stone-700 px-3 py-2">
              <SkillIcon icon={q.icon} size={24} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-text-primary">{q.title}</span>
                <span className="text-xs text-text-muted">
                  {q.targetDate ? `Target ${formatIsoDate(q.targetDate)}` : "No target date"}
                  {q.deadline && ` · Hard deadline ${formatIsoDate(q.deadline)}`}
                </span>
              </span>
              <GameButton size="sm" onClick={() => setEditing(q)}>
                New Target
              </GameButton>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ContinueDialog
          title="Reset Target"
          quest={editing}
          today={today}
          reason="RESPAWN"
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
