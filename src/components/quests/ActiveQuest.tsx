"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import {
  addObjectiveAction,
  completeQuestAction,
  moveObjectiveAction,
  questStatusAction,
  removeObjectiveAction,
  setObjectiveDoneAction,
  setQuestPriorityAction,
  updateQuestDetailsAction,
  bossAction,
  type ActionResult,
  type CompletionPayload,
} from "@/app/(realm)/quests/actions";
import { acceptQuestlineQuestAction, setManualRequirementAction } from "@/app/(realm)/questlines/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { bossHp } from "@/game/bosses";
import Link from "next/link";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { skillColor } from "@/components/skills/skill-style";
import { Badge } from "@/components/ui/Badge";
import { GameButton, GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { Notice } from "@/components/ui/Notice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { canPerform, LIMITS, QUEST_STATUS_LABELS } from "@/game/quests";
import { cx } from "@/lib/cx";
import { formatIsoDate, localToday } from "@/lib/dates";
import { ContinueDialog } from "@/components/planning/NeedsAttention";
import type { QuestDetail } from "@/server/queries/quests";
import { DifficultyBadge } from "./DifficultyBadge";
import { QuestCelebration } from "./QuestCelebration";
import { QuestDates } from "./QuestDates";
import { RewardTiles } from "./RewardTiles";

const DATE_REASONS: Record<string, string> = { EDIT: "Edited", CONTINUE: "Continued", RESCOPE: "Rescoped", RESPAWN: "Reset during Respawn" };

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

export function ActiveQuest({
  quest,
  justAccepted,
  activeMainCount,
  mainQuestCap,
  rescope = false,
  today,
}: {
  quest: QuestDetail;
  justAccepted: boolean;
  activeMainCount: number;
  mainQuestCap: number;
  /** Opened from "Quests Need Attention → Rescope". */
  rescope?: boolean;
  today: string;
}) {
  const router = useRouter();
  const ids = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CompletionPayload | null>(null);
  const [showAccepted, setShowAccepted] = useState(justAccepted);
  const [managing, setManaging] = useState(rescope);
  const [rescoping, setRescoping] = useState(false);
  const [newObjective, setNewObjective] = useState("");
  const [notes, setNotes] = useState(quest.notes);
  const [notesSaved, setNotesSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const currentRef = useRef<HTMLButtonElement>(null);

  const status = quest.status;
  const canObjectives = canPerform("COMPLETE_OBJECTIVE", status);
  const canEdit = canPerform("EDIT", status);
  const isComplete = status === "COMPLETED";
  const color = skillColor(quest.skillKey);
  const current = quest.objectives.find((o) => o.id === quest.progress.currentObjectiveId) ?? null;

  function act<T>(fn: () => Promise<ActionResult<T>>, onOk?: (data: T) => void) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) onOk?.(r.data);
      else setError(r.error);
    });
  }

  function complete() {
    act(() => completeQuestAction(quest.id, localToday()), (data) => setCelebration(data));
  }

  return (
    <div className="flex flex-col gap-4">
      {showAccepted && !isComplete && (
        <div className="flex items-start gap-2">
          <Notice tone="success" className="flex-1">
            Quest accepted! It is now in your Quest Journal. Rewards are locked in at {quest.rewards.xp.toLocaleString("en-US")} XP,{" "}
            {quest.rewards.gp} GP, and {quest.rewards.qp} QP.
          </Notice>
          <button type="button" className="px-2 py-2 text-text-muted hover:text-text-primary" aria-label="Dismiss" onClick={() => setShowAccepted(false)}>
            ✕
          </button>
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <GamePanel as="section" surface="parchment" labelledBy={`${ids}-title`} className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <SkillIcon icon={quest.icon} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={quest.difficulty} />
              <span className="text-sm font-bold" style={{ color: `color-mix(in oklab, ${color}, black 35%)` }}>
                {quest.skillName}
              </span>
              <Badge tone="parchment">{quest.priority === "MAIN" ? "Main Quest" : "Side Quest"}</Badge>
              <Badge tone={isComplete ? "moss" : status === "ABANDONED" ? "crimson" : "parchment"}>
                {status === "AVAILABLE" ? (quest.lock?.locked ? "Locked" : "Available") : QUEST_STATUS_LABELS[status]}
              </Badge>
              {quest.isBoss && (
                <Badge tone="crimson" icon={<PixelIcon name="bosses" size={12} />}>
                  {isComplete ? "Boss Defeated" : "Current Boss"}
                </Badge>
              )}
            </div>
            <h1 id={`${ids}-title`} className="q-title mt-2 text-display-md leading-tight text-parchment-ink sm:text-display-lg">
              {quest.title}
            </h1>
            {quest.description && <p className="mt-2 max-w-3xl text-parchment-ink">{quest.description}</p>}
            <div className="mt-3">
              <QuestDates targetDate={quest.targetDate} deadline={quest.deadline} active={!isComplete && status !== "ABANDONED"} tone="parchment" />
            </div>
            {quest.isBoss && (
              <div className="mt-3 flex max-w-xl items-center gap-3">
                <span className="text-sm font-bold text-parchment-ink">Boss HP</span>
                <ProgressBar
                  className="flex-1"
                  size="lg"
                  tone="crimson"
                  value={bossHp(quest.progress, isComplete)}
                  label="Boss HP"
                  valueText={`${bossHp(quest.progress, isComplete)}% HP remaining`}
                />
                <span className="text-sm font-bold tabular-nums text-parchment-ink">{bossHp(quest.progress, isComplete)}%</span>
              </div>
            )}
            {quest.progress.total > 0 && (
              <div className="mt-3 flex max-w-xl items-center gap-3">
                <ProgressBar
                  className="flex-1"
                  size="lg"
                  color={color}
                  value={isComplete ? 100 : quest.progress.percent}
                  label="Quest progress"
                  valueText={`${quest.progress.done} of ${quest.progress.total} objectives complete`}
                />
                <span className="text-sm font-bold tabular-nums text-parchment-ink">
                  {quest.progress.done} / {quest.progress.total}
                </span>
              </div>
            )}
          </div>
        </div>
      </GamePanel>

      {error && <Notice tone="error">{error}</Notice>}

      {rescope && canEdit && (
        <GamePanel as="section" aria-label="Rescope this Quest" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <PixelIcon name="quests" size={28} />
          <p className="flex-1 text-text-secondary">
            <span className="q-title block text-lg text-gold-300">Rescope this Quest</span>
            Remove objectives that no longer fit, add what is really left, then set a realistic new target. Original dates stay in the Quest&apos;s history.
          </p>
          <GameButton variant="primary" onClick={() => setRescoping(true)}>
            Set New Target
          </GameButton>
        </GamePanel>
      )}
      {rescoping && (
        <ContinueDialog
          title="Rescope Quest"
          quest={quest}
          today={today}
          reason="RESCOPE"
          onClose={() => setRescoping(false)}
          onDone={() => {
            setRescoping(false);
            router.replace(`/quests/${quest.id}`);
            router.refresh();
          }}
        />
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-4">
          {/* ── Quest Journal ─────────────────────────────────────────── */}
          <GamePanel as="section" labelledBy={`${ids}-journal`} className="p-4 sm:p-5">
            <SectionHeader
              id={`${ids}-journal`}
              icon={<PixelIcon name="quests" size={22} />}
              title="Quest Journal"
              divider
              action={
                canEdit && quest.objectives.length > 0 ? (
                  <button
                    type="button"
                    className="text-sm text-blue-300 hover:underline"
                    aria-pressed={managing}
                    onClick={() => setManaging((v) => !v)}
                  >
                    {managing ? "Done managing" : "Manage objectives"}
                  </button>
                ) : null
              }
            />

            {current && canObjectives && (
              <div className="mt-3 rounded-sm border border-blue-500 bg-blue-700/25 p-3 shadow-[0_0_14px_rgb(92_156_236/0.15)]">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-300">Current Step</p>
                <p className="q-title text-xl text-text-primary">{current.title}</p>
              </div>
            )}
            {quest.objectives.length === 0 && (
              <p className="mt-3 text-text-secondary">
                {isComplete ? "This Quest had no objectives." : "No objectives yet. Add steps below, or complete the Quest when the work is done."}
              </p>
            )}

            <ol className="mt-3 flex flex-col gap-1.5">
              {quest.objectives.map((o, i) => {
                const isCurrent = o.id === current?.id && canObjectives;
                return (
                  <li
                    key={o.id}
                    className={cx(
                      "flex items-center gap-3 rounded-sm border px-3 py-2",
                      isCurrent ? "border-blue-500 bg-stone-850" : "border-stone-700 bg-stone-900/60",
                    )}
                  >
                    <button
                      ref={isCurrent ? currentRef : undefined}
                      type="button"
                      role="checkbox"
                      aria-checked={o.done}
                      aria-label={`${o.done ? "Mark incomplete" : "Mark complete"}: ${o.title}`}
                      disabled={!canObjectives || pending}
                      onClick={() => act(() => setObjectiveDoneAction(quest.id, o.id, !o.done))}
                      className={cx(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold disabled:cursor-not-allowed",
                        o.done ? "border-moss-400 bg-moss-600 text-white" : isCurrent ? "border-blue-300 bg-blue-600/40" : "border-stone-500",
                      )}
                    >
                      {o.done ? "✓" : ""}
                    </button>
                    <span className={cx("flex-1", o.done ? "text-text-muted line-through decoration-text-muted" : "text-text-primary")}>
                      {o.title}
                      {o.done && o.completedAt && (
                        <span className="ml-2 text-xs no-underline">
                          <LocalDate iso={o.completedAt} options={{ month: "short", day: "numeric" }} />
                        </span>
                      )}
                    </span>
                    {managing && canEdit && (
                      <span className="flex gap-1">
                        <IconButton label={`Move up: ${o.title}`} disabled={i === 0 || pending} onClick={() => act(() => moveObjectiveAction(quest.id, o.id, "up"))}>
                          ↑
                        </IconButton>
                        <IconButton
                          label={`Move down: ${o.title}`}
                          disabled={i === quest.objectives.length - 1 || pending}
                          onClick={() => act(() => moveObjectiveAction(quest.id, o.id, "down"))}
                        >
                          ↓
                        </IconButton>
                        <IconButton label={`Remove: ${o.title}`} danger disabled={pending} onClick={() => act(() => removeObjectiveAction(quest.id, o.id))}>
                          ✕
                        </IconButton>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>

            {canEdit && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newObjective.trim()) return;
                  act(() => addObjectiveAction(quest.id, newObjective), () => setNewObjective(""));
                }}
              >
                <label htmlFor={`${ids}-new-objective`} className="sr-only">
                  New objective
                </label>
                <input
                  id={`${ids}-new-objective`}
                  className={field}
                  value={newObjective}
                  maxLength={LIMITS.objectiveTitleMax}
                  placeholder="Add an objective…"
                  onChange={(e) => setNewObjective(e.target.value)}
                />
                <GameButton type="submit" variant="secondary" disabled={pending || !newObjective.trim()}>
                  Add
                </GameButton>
              </form>
            )}

            {canObjectives && (
              <GameLinkButton href={`/focus?quest=${quest.id}`} variant="primary" size="lg" className="mt-4 w-full">
                {quest.isBoss ? "Enter Boss Fight →" : "Continue Quest →"}
              </GameLinkButton>
            )}
          </GamePanel>

          {/* ── Notes ─────────────────────────────────────────────────── */}
          <GamePanel as="section" labelledBy={`${ids}-notes`} className="p-4 sm:p-5">
            <SectionHeader id={`${ids}-notes`} icon={<PixelIcon name="diaries" size={22} />} title="Notes" divider />
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                act(() => updateQuestDetailsAction(quest.id, { notes }), () => setNotesSaved(true));
              }}
            >
              <label htmlFor={`${ids}-notes-field`} className="sr-only">
                Quest notes
              </label>
              <textarea
                id={`${ids}-notes-field`}
                className={cx(field, "min-h-28")}
                value={notes}
                maxLength={LIMITS.notesMax}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesSaved(false);
                }}
                placeholder="Ideas, links, and reminders for this Quest…"
              />
              <div className="mt-2 flex items-center gap-3">
                <GameButton type="submit" variant="secondary" size="sm" disabled={pending || notes === quest.notes}>
                  Save Notes
                </GameButton>
                {notesSaved && notes === quest.notes && <span className="text-sm text-moss-300" role="status">Saved ✓</span>}
              </div>
            </form>
          </GamePanel>
        </div>

        {/* ── Right column ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <GamePanel as="section" labelledBy={`${ids}-rewards`} className="p-4">
            <SectionHeader id={`${ids}-rewards`} icon={<PixelIcon name="gp" size={22} />} title={isComplete ? "Rewards Earned" : "Quest Rewards"} divider />
            <RewardTiles className="mt-3" rewards={quest.rewards} skillKey={quest.skillKey} skillName={quest.skillName} earned={isComplete} />
            {quest.xpOutcome && quest.xpOutcome.levelsGained > 0 && (
              <p className="mt-2 text-sm text-gold-200">
                Completing this Quest raises {quest.skillName} from Level {quest.xpOutcome.fromLevel} to {quest.xpOutcome.toLevel}.
              </p>
            )}
            {isComplete ? (
              <p className="mt-3 flex items-center gap-2 text-moss-300">
                <span aria-hidden>✓</span> Quest complete{quest.completedAt && <> · <LocalDate iso={quest.completedAt} /></>}
              </p>
            ) : canPerform("COMPLETE", status) ? (
              <>
                <GameButton variant="primary" size="lg" className="mt-4 w-full" disabled={pending || !quest.progress.allDone} onClick={complete}>
                  {pending ? "Completing…" : "Complete Quest"}
                </GameButton>
                {!quest.progress.allDone && (
                  <p className="mt-2 text-sm text-text-muted">
                    {quest.progress.total - quest.progress.done} objective{quest.progress.total - quest.progress.done === 1 ? "" : "s"} remaining.
                  </p>
                )}
              </>
            ) : null}
          </GamePanel>

          <GamePanel as="section" labelledBy={`${ids}-details`} className="p-4">
            <SectionHeader
              id={`${ids}-details`}
              icon={<PixelIcon name="questlines" size={22} />}
              title="Details"
              divider
              action={
                canEdit ? (
                  <button type="button" className="text-sm text-blue-300 hover:underline" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                ) : null
              }
            />
            <dl className="mt-2 text-sm">
              {quest.questline && (
                <Row
                  label="Questline"
                  value={
                    <Link href={`/questlines?id=${quest.questline.id}`} className="text-blue-300 hover:underline">
                      {quest.questline.title}
                    </Link>
                  }
                />
              )}
              <Row label="Skill" value={quest.skillName} />
              <Row label="Difficulty" value={<DifficultyBadge difficulty={quest.difficulty} />} />
              {quest.acceptedAt && <Row label="Accepted" value={<LocalDate iso={quest.acceptedAt} />} />}
              {quest.abandonedAt && <Row label="Abandoned" value={<LocalDate iso={quest.abandonedAt} />} />}
            </dl>
            {canEdit && (
              <fieldset className="mt-3">
                <legend className="mb-1 text-sm font-bold text-text-secondary">Priority</legend>
                <div className="flex gap-1.5">
                  {(["MAIN", "SIDE"] as const).map((p) => {
                    const blocked = p === "MAIN" && quest.priority !== "MAIN" && activeMainCount >= mainQuestCap;
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={quest.priority === p}
                        disabled={pending || blocked || quest.priority === p}
                        onClick={() => act(() => setQuestPriorityAction(quest.id, p))}
                        className={cx(
                          "flex-1 rounded-sm border px-2 py-2 text-sm disabled:cursor-not-allowed",
                          quest.priority === p ? "border-gold-500 bg-gold-700/25 text-gold-200" : "border-stone-600 text-text-primary hover:border-stone-500",
                          blocked && "opacity-50",
                        )}
                      >
                        {quest.priority === p && <span aria-hidden>✓ </span>}
                        {p === "MAIN" ? "Main Quest" : "Side Quest"}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </GamePanel>

          {status === "AVAILABLE" ? (
            <AcceptPanel quest={quest} pending={pending} activeMainCount={activeMainCount} mainQuestCap={mainQuestCap} act={act} />
          ) : (
            <StatusPanel
              quest={quest}
              pending={pending}
              onAct={(action) => act(() => questStatusAction(quest.id, action))}
              onBoss={(action) => act(() => bossAction(quest.id, action))}
            />
          )}

          {quest.activity.length > 0 && (
            <GamePanel as="section" labelledBy={`${ids}-activity`} className="p-4">
              <SectionHeader id={`${ids}-activity`} icon={<PixelIcon name="diaries" size={22} />} title="Activity" divider />
              <ol className="mt-2 text-sm">
                {quest.activity.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3 border-b border-stone-800 py-1.5 last:border-0">
                    <span className="text-text-secondary">{a.text}</span>
                    <span className="shrink-0 text-text-muted">
                      <LocalDate iso={a.createdAt} options={{ month: "short", day: "numeric" }} />
                    </span>
                  </li>
                ))}
              </ol>
            </GamePanel>
          )}

          {quest.dateHistory.length > 0 && (
            <GamePanel as="section" labelledBy={`${ids}-dates`} className="p-4">
              <SectionHeader id={`${ids}-dates`} icon={<PixelIcon name="diaries" size={22} />} title="Date History" divider />
              <ol className="mt-2 text-sm">
                {quest.dateHistory.map((h, i) => (
                  <li key={i} className="border-b border-stone-800 py-1.5 last:border-0">
                    <span className="text-text-secondary">
                      {h.field === "TARGET" ? "Target" : "Hard deadline"}: {h.oldValue ? formatIsoDate(h.oldValue) : "none"} → {h.newValue ? formatIsoDate(h.newValue) : "none"}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {DATE_REASONS[h.reason] ?? "Edited"} · <LocalDate iso={h.changedAt} options={{ month: "short", day: "numeric", year: "numeric" }} />
                    </span>
                  </li>
                ))}
              </ol>
            </GamePanel>
          )}

          <GameLinkButton href="/quests" variant="ghost" size="sm">
            ← Back to Quest Journal
          </GameLinkButton>
        </div>
      </div>

      <EditDetailsDialog
        quest={quest}
        open={editing}
        onOpenChange={setEditing}
        onSave={(input) => act(() => updateQuestDetailsAction(quest.id, input), () => setEditing(false))}
        pending={pending}
      />
      <QuestCelebration
        payload={celebration}
        onClose={() => {
          setCelebration(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone-800 py-1.5 last:border-0">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-right text-text-primary">{value}</dd>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "flex size-8 items-center justify-center rounded-sm border border-stone-600 text-text-secondary disabled:opacity-40",
        danger ? "hover:border-crimson-500 hover:text-crimson-300" : "hover:border-stone-400 hover:text-text-primary",
      )}
    >
      {children}
    </button>
  );
}

function StatusPanel({
  quest,
  pending,
  onAct,
  onBoss,
}: {
  quest: QuestDetail;
  pending: boolean;
  onAct: (action: "hold" | "resume" | "abandon" | "restore") => void;
  onBoss: (action: "designate" | "clear") => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const s = quest.status;
  if (s === "COMPLETED") return null;
  return (
    <GamePanel as="section" aria-label="Quest status" className="p-4">
      <SectionHeader icon={<PixelIcon name="settings" size={22} />} title="Quest Status" divider />
      <p className="mt-2 text-sm text-text-secondary">
        Current status: <span className="font-bold text-text-primary">{QUEST_STATUS_LABELS[s]}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {canPerform("HOLD", s) && (
          <GameButton variant="secondary" size="sm" disabled={pending} onClick={() => onAct("hold")}>
            Put On Hold
          </GameButton>
        )}
        {canPerform("RESUME", s) && (
          <GameButton variant="primary" size="sm" disabled={pending} onClick={() => onAct("resume")}>
            Resume Quest
          </GameButton>
        )}
        {canPerform("RESTORE", s) && (
          <GameButton variant="primary" size="sm" disabled={pending} onClick={() => onAct("restore")}>
            Restore Quest
          </GameButton>
        )}
        {canPerform("ABANDON", s) && (
          <GameButton variant="ghost" size="sm" className="text-crimson-300 hover:text-crimson-300" disabled={pending} onClick={() => setConfirming(true)}>
            Abandon Quest
          </GameButton>
        )}
      </div>
      {s === "ABANDONED" && <p className="mt-2 text-sm text-text-muted">Abandoned Quests award no rewards. Their history is kept and they can be restored.</p>}
      {canPerform("EDIT", s) && (
        <div className="mt-3 border-t border-stone-700 pt-3">
          {quest.isBoss ? (
            <>
              <p className="text-sm text-text-secondary">This Quest is your Current Boss. Defeat it on time to claim the bounty.</p>
              <GameButton variant="ghost" size="sm" className="mt-1 px-0" disabled={pending} onClick={() => onBoss("clear")}>
                Stand Boss Down
              </GameButton>
            </>
          ) : (
            <>
              <GameButton variant="secondary" size="sm" disabled={pending} onClick={() => onBoss("designate")}>
                <PixelIcon name="bosses" size={16} /> Designate as Current Boss
              </GameButton>
              <p className="mt-1 text-xs text-text-muted">One Boss at a time. Designating this one stands any other Boss down.</p>
            </>
          )}
        </div>
      )}
      <Dialog.Root open={confirming} onOpenChange={setConfirming}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-void/80" />
          <Dialog.Content className="q-stone q-frame-gold fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 p-6 focus:outline-none">
            <Dialog.Title className="q-title text-2xl text-gold-300">Abandon this Quest?</Dialog.Title>
            <Dialog.Description className="mt-2 text-text-secondary">
              “{quest.title}” will award no rewards. Your progress, notes, and dates are kept, and you can restore it later. Nothing
              you have already earned is lost.
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <GameButton variant="secondary">Keep Quest</GameButton>
              </Dialog.Close>
              <GameButton
                variant="primary"
                onClick={() => {
                  setConfirming(false);
                  onAct("abandon");
                }}
              >
                Abandon Quest
              </GameButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </GamePanel>
  );
}

function EditDetailsDialog({
  quest,
  open,
  onOpenChange,
  onSave,
  pending,
}: {
  quest: QuestDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: { title: string; description: string; targetDate: string | null; deadline: string | null }) => void;
  pending: boolean;
}) {
  const ids = useId();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-void/80" />
        <Dialog.Content className="q-stone q-frame-gold fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(94vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 focus:outline-none">
          <Dialog.Title className="q-title text-2xl text-gold-300">Edit Quest</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-text-secondary">
            Skill, difficulty, and rewards were locked in when the Quest was accepted.
          </Dialog.Description>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              onSave({
                title: String(f.get("title") ?? ""),
                description: String(f.get("description") ?? ""),
                targetDate: String(f.get("targetDate") ?? "") || null,
                deadline: String(f.get("deadline") ?? "") || null,
              });
            }}
          >
            <label className="text-sm font-bold text-text-secondary" htmlFor={`${ids}-t`}>
              Quest name
            </label>
            <input id={`${ids}-t`} name="title" className={field} defaultValue={quest.title} maxLength={LIMITS.titleMax} required />
            <label className="text-sm font-bold text-text-secondary" htmlFor={`${ids}-d`}>
              Story
            </label>
            <textarea id={`${ids}-d`} name="description" className={cx(field, "min-h-20")} defaultValue={quest.description} maxLength={LIMITS.descriptionMax} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-text-secondary" htmlFor={`${ids}-td`}>
                  Target date
                </label>
                <input id={`${ids}-td`} name="targetDate" type="date" className={field} defaultValue={quest.targetDate ?? ""} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-text-secondary" htmlFor={`${ids}-dl`}>
                  Hard deadline
                </label>
                <input id={`${ids}-dl`} name="deadline" type="date" className={field} defaultValue={quest.deadline ?? ""} />
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Dialog.Close asChild>
                <GameButton variant="secondary">Cancel</GameButton>
              </Dialog.Close>
              <GameButton type="submit" variant="primary" disabled={pending}>
                Save Changes
              </GameButton>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AcceptPanel({
  quest,
  pending,
  activeMainCount,
  mainQuestCap,
  act,
}: {
  quest: QuestDetail;
  pending: boolean;
  activeMainCount: number;
  mainQuestCap: number;
  act: <T>(fn: () => Promise<ActionResult<T>>, onOk?: (data: T) => void) => void;
}) {
  const router = useRouter();
  const ids = useId();
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<"MAIN" | "SIDE">("SIDE");
  const lock = quest.lock;
  const locked = Boolean(lock?.locked);
  return (
    <GamePanel as="section" labelledBy={`${ids}-accept`} className="p-4">
      <SectionHeader id={`${ids}-accept`} icon={<PixelIcon name={locked ? "lock" : "quests"} size={22} />} title={locked ? "Locked Quest" : "Accept Quest"} divider />
      {lock && (lock.dependencies.length > 0 || lock.requirements.length > 0) && (
        <>
          <p className="mt-3 text-sm font-bold text-gold-300">Requirements</p>
          <ul className="mt-1 flex flex-col gap-1.5 text-sm">
            {lock.dependencies.map((d) => (
              <li key={d.questId} className="flex items-center gap-2">
                <span aria-hidden className={d.met ? "text-moss-300" : "text-text-muted"}>{d.met ? "✓" : "○"}</span>
                <span className={d.met ? "text-text-secondary" : "text-text-primary"}>
                  Complete{" "}
                  <Link href={`/quests/${d.questId}`} className="text-blue-300 hover:underline">
                    {d.title}
                  </Link>
                </span>
                <span className="sr-only">{d.met ? "(met)" : "(not met)"}</span>
              </li>
            ))}
            {lock.requirements.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                {r.type === "MANUAL" ? (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={r.met}
                    aria-label={`${r.description}: ${r.met ? "met" : "not met"}`}
                    disabled={pending}
                    onClick={() => act(() => setManualRequirementAction(r.id, !r.met))}
                    className={cx("flex size-5 items-center justify-center rounded-xs border text-xs", r.met ? "border-moss-400 bg-moss-600 text-white" : "border-stone-500")}
                  >
                    {r.met ? "✓" : ""}
                  </button>
                ) : (
                  <span aria-hidden className={r.met ? "text-moss-300" : "text-text-muted"}>{r.met ? "✓" : "○"}</span>
                )}
                <span className={r.met ? "text-text-secondary" : "text-text-primary"}>{r.description}</span>
                <span className="ml-auto text-xs text-text-muted">{r.type === "MANUAL" ? "" : `(you have ${r.current})`}</span>
                <span className="sr-only">{r.met ? "(met)" : "(not met)"}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {locked ? (
        <p className="mt-3 text-sm text-text-muted">Meet every requirement to unlock this Quest.</p>
      ) : (
        <form
          className="mt-3 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            act(() => acceptQuestlineQuestAction(quest.id, { targetDate: targetDate || null, priority }, localToday()), () => router.refresh());
          }}
        >
          <div>
            <label htmlFor={`${ids}-target`} className="mb-1 block text-sm font-bold text-text-secondary">
              Target date (optional)
            </label>
            <input id={`${ids}-target`} type="date" className={field} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Priority">
            {(["SIDE", "MAIN"] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={priority === p}
                disabled={p === "MAIN" && activeMainCount >= mainQuestCap}
                onClick={() => setPriority(p)}
                className={cx(
                  "flex-1 rounded-sm border px-2 py-2 text-sm disabled:opacity-50",
                  priority === p ? "border-gold-500 bg-gold-700/25 text-gold-200" : "border-stone-600 text-text-primary",
                )}
              >
                {priority === p && "✓ "}
                {p === "MAIN" ? "Main Quest" : "Side Quest"}
              </button>
            ))}
          </div>
          <GameButton type="submit" variant="primary" size="lg" disabled={pending}>
            Accept Quest →
          </GameButton>
          <p className="text-xs text-text-muted">Rewards are locked in when you accept.</p>
        </form>
      )}
    </GamePanel>
  );
}
