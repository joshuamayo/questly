"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Menu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useCallback, useId, useOptimistic, useRef, useState, useTransition } from "react";
import {
  addQuestAction,
  completeQuestAction,
  moveQuestAction,
  removeQuestAction,
  reorderQuestsAction,
  undoRemoveQuestAction,
  updateQuestAction,
} from "@/app/(realm)/actions";
import { IconTile } from "@/components/icons/IconTile";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameButton, GameLinkButton } from "@/components/ui/GameButton";
import { GameDialog } from "@/components/ui/GameDialog";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { playChime } from "@/lib/sound";
import type { CompletedView, QuestLog, QuestView } from "@/server/loaders";
import { CompletionReveal, type CompletionPayload } from "./CompletionReveal";
import { QuestFormDialog, type QuestFormValues } from "./QuestFormDialog";

export type BoardSettings = {
  defaultQuestGp: number;
  confirmCompletion: boolean;
  celebrateCompletions: boolean;
  sound: boolean;
  showSavingsGoal: boolean;
  showRecentCompletions: boolean;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function QuestLogBoard({ log, gpBalance, settings }: { log: QuestLog; gpBalance: number; settings: BoardSettings }) {
  const serverActive = log.current ? [log.current, ...log.locked] : log.locked;
  // Optimistic order: applied instantly, rolled back automatically if the save fails.
  const [active, setOptimisticActive] = useOptimistic(serverActive);
  const [pending, startTransition] = useTransition();
  const [formPending, startFormTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<QuestView | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<QuestView | null>(null);
  const [celebration, setCelebration] = useState<CompletionPayload | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastId = useRef(0);
  const dndId = useId();
  const current = active[0] ?? null;

  const notify = useCallback((message: string, extra: Partial<ToastState> = {}) => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, ...extra });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  function run<T>(fn: () => Promise<Result<T>>, onOk?: (data: T) => void, optimistic?: QuestView[]) {
    startTransition(async () => {
      if (optimistic) setOptimisticActive(optimistic);
      const r = await fn();
      if (r.ok) onOk?.(r.data);
      else notify(r.error, { tone: "error" });
    });
  }

  function reorder(next: QuestView[], undoIds?: string[], label?: string) {
    run(
      () => reorderQuestsAction(next.map((q) => q.id)),
      () => {
        if (undoIds && label) notify(label, { action: { label: "Undo", onClick: () => run(() => reorderQuestsAction(undoIds)) } });
      },
      next,
    );
  }

  function move(quest: QuestView, toIndex: number) {
    const from = active.findIndex((q) => q.id === quest.id);
    if (from < 0 || toIndex === from) return;
    const next = arrayMove(active, from, Math.max(0, Math.min(toIndex, active.length - 1)));
    const before = active.map((q) => q.id);
    run(
      () => moveQuestAction(quest.id, toIndex),
      () =>
        notify(toIndex === 0 ? `“${quest.title}” is now your Current Quest.` : `Moved “${quest.title}”.`, {
          action: { label: "Undo", onClick: () => run(() => reorderQuestsAction(before)) },
        }),
      next,
    );
  }

  function complete(quest: QuestView) {
    setConfirming(null);
    run(
      () => completeQuestAction(quest.id),
      (data) => {
        if (settings.sound) playChime("complete");
        if (settings.celebrateCompletions) setCelebration(data);
        else notify(`Quest Complete! +${data.gpEarned} GP${data.next ? ` · Up next: ${data.next.title}` : ""}`, { tone: "success" });
      },
      active.slice(1),
    );
  }

  function requestComplete(quest: QuestView) {
    if (settings.confirmCompletion) setConfirming(quest);
    else complete(quest);
  }

  function submitForm(values: QuestFormValues) {
    setFormError(null);
    startFormTransition(async () => {
      const r = editing
        ? await updateQuestAction(editing.id, { title: values.title, description: values.description, gpReward: values.gpReward })
        : await addQuestAction(values);
      if (!r.ok) return setFormError(r.error);
      if (!editing) notify(values.position === "top" ? "Quest added as your Current Quest." : "Quest added to your Quest Log.", { tone: "success" });
      setAdding(false);
      setEditing(null);
    });
  }

  function remove(quest: QuestView) {
    const index = active.findIndex((q) => q.id === quest.id);
    setEditing(null);
    run(
      () => removeQuestAction(quest.id),
      () => notify(`Removed “${quest.title}”. No GP was awarded.`, { action: { label: "Undo", onClick: () => run(() => undoRemoveQuestAction(quest.id, index)) } }),
      active.filter((q) => q.id !== quest.id),
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const titleOf = (id: string | number) => active.find((q) => q.id === id)?.title ?? "quest";
  const position = (id: string | number) => active.findIndex((q) => q.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${titleOf(a.id)}, position ${position(a.id)} of ${active.length}.`,
    onDragOver: ({ active: a, over }) => (over ? `${titleOf(a.id)} is over position ${position(over.id)}.` : undefined),
    onDragEnd: ({ active: a, over }) =>
      over ? `${titleOf(a.id)} dropped at position ${position(over.id)}${position(over.id) === 1 ? ". It is now your Current Quest." : "."}` : "Move cancelled.",
    onDragCancel: ({ active: a }) => `Move cancelled. ${titleOf(a.id)} stays where it was.`,
  };

  function onDragEnd({ active: a, over }: DragEndEvent) {
    if (!over || a.id === over.id) return;
    const from = active.findIndex((q) => q.id === a.id);
    const to = active.findIndex((q) => q.id === over.id);
    const next = arrayMove(active, from, to);
    reorder(next, active.map((q) => q.id), to === 0 ? `“${next[0].title}” is now your Current Quest.` : `Moved “${titleOf(a.id)}”.`);
  }

  // A short look back keeps the path visible: the last two completed Quests, oldest first.
  const done = [...log.recent.slice(0, 2)].reverse();

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <CurrentQuestCard
          quest={current}
          pending={pending}
          onComplete={() => current && requestComplete(current)}
          onEdit={() => current && setEditing(current)}
          onAdd={() => setAdding(true)}
        />

        <GamePanel as="section" labelledBy="quest-log-heading" className="p-3 sm:p-4">
          <SectionHeader
            id="quest-log-heading"
            title="Quest Log"
            action={
              <GameButton size="sm" onClick={() => setAdding(true)} icon={<span aria-hidden>＋</span>}>
                Add Quest
              </GameButton>
            }
          />
          {active.length === 0 && done.length === 0 ? (
            <p className="mt-3 text-text-secondary">Quests you add appear here in order. The first one is always your Current Quest.</p>
          ) : (
            <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} accessibility={{ announcements }}>
              <ol className="mt-3 flex flex-col gap-1.5" aria-label="Quest Log, in order">
                {done.map((q, i) => (
                  <DoneRow key={q.id} quest={q} number={i + 1} />
                ))}
                <SortableContext items={active.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                  {active.map((q, i) => (
                    <QuestRow
                      key={q.id}
                      quest={q}
                      number={done.length + i + 1}
                      index={i}
                      total={active.length}
                      disabled={pending}
                      onEdit={() => setEditing(q)}
                      onMove={(to) => move(q, to)}
                      onRemove={() => remove(q)}
                    />
                  ))}
                </SortableContext>
              </ol>
            </DndContext>
          )}
          {active.length > 1 && (
            <p className="mt-3 text-xs text-text-muted">
              Drag <span aria-hidden>≡</span> to reorder, or use a quest&apos;s menu. Locked quests can be planned but not completed until they come up.
            </p>
          )}
        </GamePanel>
      </div>

      <aside className="flex flex-col gap-4" aria-label="Gold and rewards">
        <GamePanel as="section" labelledBy="gp-heading" className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <PixelIcon name="gp" size={56} />
            <div>
              <h2 id="gp-heading" className="q-title text-lg text-text-primary">
                Gold Pieces (GP)
              </h2>
              <p className="q-title text-display-md leading-none tabular-nums text-gold-200">{formatNumber(gpBalance)} GP</p>
            </div>
          </div>
          <GameLinkButton href="/reward-shop" className="w-full" icon={<PixelIcon name="collection" size={22} />}>
            Visit Reward Shop →
          </GameLinkButton>
        </GamePanel>

        {settings.showSavingsGoal &&
          (log.savingsGoal ? (
            <GamePanel as="section" surface="parchment" aria-label="Savings goal" className="p-4">
              <p className="text-sm font-bold text-parchment-ink-soft">Saving for:</p>
              <div className="mt-2 flex items-center gap-3">
                <IconTile icon={log.savingsGoal.icon} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="q-title truncate text-xl text-parchment-ink">{log.savingsGoal.name}</p>
                  <p className="text-sm font-bold tabular-nums text-parchment-ink">
                    {formatNumber(log.savingsGoal.current)} / {formatNumber(log.savingsGoal.target)} GP
                  </p>
                </div>
              </div>
              <ProgressBar
                className="mt-2"
                tone="gold"
                value={log.savingsGoal.percent}
                label={`Progress toward ${log.savingsGoal.name}`}
                valueText={`${log.savingsGoal.current} of ${log.savingsGoal.target} GP`}
              />
              {log.savingsGoal.percent >= 100 && <p className="mt-2 text-sm font-bold text-moss-700">You can afford it! Redeem it in the Reward Shop.</p>}
            </GamePanel>
          ) : (
            <Link href="/reward-shop" className="q-stone q-frame block p-4 text-sm text-text-secondary hover:text-text-primary">
              <span className="flex items-center gap-2">
                <PixelIcon name="star" size={20} /> Pick a reward to save for →
              </span>
            </Link>
          ))}

        {settings.showRecentCompletions && log.recent.length > 0 && <RecentCompletions recent={log.recent} />}
      </aside>

      {(adding || editing) && (
        <QuestFormDialog
          key={editing?.id ?? "add"}
          mode={editing ? "edit" : "add"}
          initial={editing ?? undefined}
          defaultGp={settings.defaultQuestGp}
          hasCurrent={active.length > 0}
          pending={formPending}
          error={formError}
          onSubmit={submitForm}
          onRemove={editing ? () => remove(editing) : undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
            setFormError(null);
          }}
        />
      )}

      <GameDialog open={Boolean(confirming)} onOpenChange={(o) => !o && setConfirming(null)} title="Complete this quest?" description={confirming?.title}>
        <div className="mt-4 flex justify-end gap-2">
          <GameButton onClick={() => setConfirming(null)}>Not yet</GameButton>
          <GameButton variant="success" onClick={() => confirming && complete(confirming)}>
            Complete Quest
          </GameButton>
        </div>
      </GameDialog>

      <CompletionReveal payload={celebration} onClose={() => setCelebration(null)} />
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function CurrentQuestCard({
  quest,
  pending,
  onComplete,
  onEdit,
  onAdd,
}: {
  quest: QuestView | null;
  pending: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onAdd: () => void;
}) {
  if (!quest) {
    return (
      <GamePanel as="section" surface="parchment" aria-label="Current Quest" className="p-4">
        <EmptyState
          tone="parchment"
          icon={<PixelIcon name="quests" size={56} />}
          title="Your Quest Log is empty."
          message="Every adventure starts somewhere."
          action={
            <GameButton variant="success" size="lg" onClick={onAdd}>
              Add Your First Quest
            </GameButton>
          }
        />
      </GamePanel>
    );
  }
  return (
    <GamePanel as="section" surface="parchment" labelledBy="current-quest-title" className="p-5 sm:p-6">
      <p className="q-title flex items-center gap-2 text-xl text-parchment-ink">
        <PixelIcon name="combat" size={26} /> Current Quest
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="hidden shrink-0 sm:block">
          <PixelIcon name="quests" size={84} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="current-quest-title" className="q-title break-words text-display-md leading-tight text-parchment-ink sm:text-display-lg">
            {quest.title}
          </h2>
          {quest.description && <Description text={quest.description} />}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-sm border border-parchment-400 bg-parchment-100/60 px-3 py-2 font-bold text-parchment-ink">
              <PixelIcon name="gp" size={22} /> Reward: +{formatNumber(quest.gpReward)} GP
            </span>
            <GameButton variant="ghost" size="sm" className="text-parchment-ink underline-offset-4" onClick={onEdit}>
              Edit
            </GameButton>
            <GameButton variant="success" size="lg" className="w-full sm:ml-auto sm:w-auto sm:min-w-56" disabled={pending} onClick={onComplete}>
              Complete Quest
            </GameButton>
          </div>
        </div>
      </div>
    </GamePanel>
  );
}

/** Plain text with optional "- [ ] item" / "- [x] item" checklist lines. */
function Description({ text }: { text: string }) {
  const blocks: { type: "p" | "list"; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const type = /^- \[( |x)\] /i.test(line) ? "list" : "p";
    const last = blocks[blocks.length - 1];
    if (last && last.type === type) last.lines.push(line);
    else blocks.push({ type, lines: [line] });
  }
  return (
    <div className="mt-2 flex max-w-3xl flex-col gap-2 text-parchment-ink">
      {blocks.map((b, i) =>
        b.type === "p" ? (
          b.lines.join("\n").trim() && (
            <p key={i} className="whitespace-pre-line">
              {b.lines.join("\n").trim()}
            </p>
          )
        ) : (
          <ul key={i} className="flex flex-col gap-0.5">
            {b.lines.map((l, j) => {
              const done = /^- \[x\]/i.test(l);
              return (
                <li key={j} className="flex items-start gap-2">
                  <span aria-hidden className="font-bold">{done ? "☑" : "☐"}</span>
                  <span className={done ? "text-parchment-ink-soft line-through" : undefined}>
                    {l.replace(/^- \[( |x)\] /i, "")}
                    <span className="sr-only">{done ? " (done)" : ""}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ),
      )}
    </div>
  );
}

function DoneRow({ quest, number }: { quest: CompletedView; number: number }) {
  return (
    <li className="flex min-h-11 items-center gap-3 rounded-sm border border-stone-800 bg-stone-950/40 px-3 py-1.5 opacity-80">
      <span className="w-6 text-right tabular-nums text-text-muted">{number}.</span>
      <PixelIcon name="check" size={22} label="Completed" />
      <span className="min-w-0 flex-1 truncate text-text-muted line-through">{quest.title}</span>
      <span className="flex items-center gap-1 text-sm tabular-nums text-text-muted">
        <PixelIcon name="gp" size={16} />+{formatNumber(quest.gpReward)} GP
      </span>
      <span className="w-[4.5rem]" aria-hidden />
    </li>
  );
}

function QuestRow({
  quest,
  number,
  index,
  total,
  disabled,
  onEdit,
  onMove,
  onRemove,
}: {
  quest: QuestView;
  number: number;
  index: number;
  total: number;
  disabled: boolean;
  onEdit: () => void;
  onMove: (toIndex: number) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: quest.id });
  const isCurrent = index === 0;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        "relative flex min-h-12 items-center gap-3 rounded-sm border px-3 py-1.5",
        isCurrent
          ? "border-gold-500 bg-[linear-gradient(90deg,rgb(219_167_63/0.18),rgb(219_167_63/0.04))] shadow-[0_0_14px_rgb(219_167_63/0.18)]"
          : "border-stone-700 bg-stone-900/40",
        isDragging && "z-10 shadow-deep ring-1 ring-gold-400",
      )}
    >
      <span className="w-6 text-right tabular-nums text-text-secondary">{number}.</span>
      {isCurrent ? <PixelIcon name="sword" size={22} label="Current Quest" /> : <PixelIcon name="lock" size={20} label="Locked" className="opacity-80" />}
      <button type="button" onClick={onEdit} className={cx("min-w-0 flex-1 truncate text-left hover:underline", isCurrent ? "font-bold text-gold-100" : "text-text-primary")}>
        {quest.title}
        <span className="sr-only">{isCurrent ? " (Current Quest)" : " (Locked)"} — edit</span>
      </button>
      <span className="flex shrink-0 items-center gap-1 text-sm tabular-nums text-gold-200">
        <PixelIcon name="gp" size={16} />+{formatNumber(quest.gpReward)} GP
      </span>
      <Menu.Root>
        <Menu.Trigger
          disabled={disabled}
          aria-label={`Actions for ${quest.title}`}
          className="flex size-8 items-center justify-center rounded-sm text-text-secondary hover:bg-stone-800 hover:text-text-primary disabled:opacity-50"
        >
          <span aria-hidden>⋯</span>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content align="end" sideOffset={4} className="q-stone q-frame z-50 min-w-48 p-1 text-sm">
            <MenuItem onSelect={onEdit}>Edit</MenuItem>
            {!isCurrent && <MenuItem onSelect={() => onMove(0)}>Make Current Quest</MenuItem>}
            {index > 0 && <MenuItem onSelect={() => onMove(index - 1)}>Move up</MenuItem>}
            {index < total - 1 && <MenuItem onSelect={() => onMove(index + 1)}>Move down</MenuItem>}
            {index < total - 1 && <MenuItem onSelect={() => onMove(total - 1)}>Move to end</MenuItem>}
            <Menu.Separator className="my-1 h-px bg-stone-700" />
            <MenuItem onSelect={onRemove} danger>
              Remove from Quest Log
            </MenuItem>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        disabled={disabled || total < 2}
        aria-label={`Reorder ${quest.title}. Press Space, then arrow keys to move.`}
        className="flex size-8 cursor-grab touch-none items-center justify-center rounded-sm text-lg text-text-secondary hover:bg-stone-800 hover:text-text-primary active:cursor-grabbing disabled:cursor-default disabled:opacity-40"
      >
        <span aria-hidden>≡</span>
      </button>
    </li>
  );
}

function MenuItem({ children, onSelect, danger = false }: { children: React.ReactNode; onSelect: () => void; danger?: boolean }) {
  return (
    <Menu.Item
      onSelect={onSelect}
      className={cx(
        "flex min-h-9 cursor-pointer select-none items-center rounded-xs px-3 outline-none data-[highlighted]:bg-stone-700",
        danger ? "text-crimson-300" : "text-text-primary",
      )}
    >
      {children}
    </Menu.Item>
  );
}

function RecentCompletions({ recent }: { recent: CompletedView[] }) {
  return (
    <GamePanel as="section" labelledBy="recent-heading" className="p-4">
      <SectionHeader
        id="recent-heading"
        level={2}
        icon={<PixelIcon name="check" size={20} />}
        title="Recent Completions"
        action={
          <Link href="/completed" className="text-sm text-blue-300 underline-offset-4 hover:underline">
            View All →
          </Link>
        }
      />
      <ul className="mt-2 flex flex-col divide-y divide-stone-800">
        {recent.map((q) => (
          <li key={q.id} className="flex items-center gap-3 py-2">
            <PixelIcon name="check" size={20} label="Completed" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-text-primary">{q.title}</span>
              <span className="text-xs text-text-muted">
                <LocalDate iso={q.completedAt} options={{ month: "short", day: "numeric", year: "numeric" }} />
              </span>
            </span>
            <span className="shrink-0 font-bold tabular-nums text-gold-200">+{formatNumber(q.gpReward)} GP</span>
          </li>
        ))}
      </ul>
    </GamePanel>
  );
}
