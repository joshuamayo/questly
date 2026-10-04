"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { continueQuestAction, questStatusAction } from "@/app/(realm)/quests/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { GameButton } from "@/components/ui/GameButton";
import { GameDialog } from "@/components/ui/GameDialog";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { addDays } from "@/game/planning";
import { formatIsoDate, localToday } from "@/lib/dates";
import { useAction } from "@/lib/use-action";

export type AttentionView = {
  id: string;
  title: string;
  icon: string;
  reason: "PAST_DEADLINE" | "PAST_TARGET";
  targetDate: string | null;
  deadline: string | null;
  progress: { done: number; total: number };
};

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

/**
 * "Quests Need Attention" (Product Spec §22): each overdue Quest asks for a
 * decision — Continue, Rescope, or Abandon. Never a red overdue counter.
 */
export function NeedsAttention({ items, today, reason = "CONTINUE", heading = true }: { items: AttentionView[]; today: string; reason?: "CONTINUE" | "RESPAWN"; heading?: boolean }) {
  const [continuing, setContinuing] = useState<AttentionView | null>(null);
  const [abandoning, setAbandoning] = useState<AttentionView | null>(null);
  const router = useRouter();
  const { pending, error, run } = useAction();
  if (items.length === 0) return null;

  return (
    <GamePanel as="section" surface="parchment" labelledBy={heading ? "needs-attention" : undefined} className="p-4">
      {heading && (
        <SectionHeader
          id="needs-attention"
          tone="parchment"
          title="Quests Need Attention"
          eyebrow="A decision keeps the adventure honest"
          icon={<PixelIcon name="quests" size={22} />}
        />
      )}
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((q) => (
          <li key={q.id} className="flex flex-col gap-2 rounded-sm border border-parchment-400/70 bg-parchment-100/40 p-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SkillIcon icon={q.icon} size={28} />
              <div className="min-w-0">
                <Link href={`/quests/${q.id}`} className="q-title block truncate text-lg text-parchment-ink hover:underline">
                  {q.title}
                </Link>
                <p className="text-sm text-parchment-ink-soft">
                  {q.reason === "PAST_DEADLINE" ? `Hard deadline passed (${formatIsoDate(q.deadline!)})` : `Target date passed (${formatIsoDate(q.targetDate!)})`}
                  {q.progress.total > 0 && ` · ${q.progress.done}/${q.progress.total} objectives`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <GameButton size="sm" variant="primary" disabled={pending} onClick={() => setContinuing(q)}>
                Continue
              </GameButton>
              <Link
                href={`/quests/${q.id}?rescope=1`}
                className="inline-flex min-h-9 items-center rounded-sm border border-blue-600 bg-stone-850 px-3 text-sm text-text-primary hover:border-blue-400"
              >
                Rescope
              </Link>
              <GameButton size="sm" variant="ghost" className="text-parchment-ink" disabled={pending} onClick={() => setAbandoning(q)}>
                Abandon
              </GameButton>
            </div>
          </li>
        ))}
      </ul>

      {continuing && (
        <ContinueDialog
          quest={continuing}
          today={today}
          reason={reason}
          onClose={() => setContinuing(null)}
          onDone={() => {
            setContinuing(null);
            router.refresh();
          }}
        />
      )}
      <GameDialog
        open={Boolean(abandoning)}
        onOpenChange={(o) => !o && setAbandoning(null)}
        title="Abandon this Quest?"
        description="Abandoned Quests give no rewards, but their history is kept and they can be restored later."
      >
        <div className="mt-4 flex justify-end gap-2">
          <GameButton onClick={() => setAbandoning(null)}>Keep it</GameButton>
          <GameButton
            variant="primary"
            disabled={pending}
            onClick={() =>
              abandoning &&
              run(() => questStatusAction(abandoning.id, "abandon"), () => {
                setAbandoning(null);
                router.refresh();
              })
            }
          >
            Abandon Quest
          </GameButton>
        </div>
      </GameDialog>
    </GamePanel>
  );
}

export function ContinueDialog({
  quest,
  today,
  reason,
  onClose,
  onDone,
  title = "Continue Quest",
}: {
  quest: Pick<AttentionView, "id" | "title" | "deadline" | "targetDate">;
  today: string;
  reason: "CONTINUE" | "RESCOPE" | "RESPAWN";
  onClose: () => void;
  onDone: () => void;
  title?: string;
}) {
  const { pending, error, run } = useAction();
  const deadlinePassed = Boolean(quest.deadline && quest.deadline < today);
  const [target, setTarget] = useState(addDays(today, 7));
  const [deadline, setDeadline] = useState(deadlinePassed ? addDays(today, 14) : "");
  const [removeDeadline, setRemoveDeadline] = useState(false);

  return (
    <GameDialog open onOpenChange={(o) => !o && onClose()} title={title} description={`Set a new, realistic target for “${quest.title}”. The original dates stay in its history.`}>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const input: { targetDate: string; deadline?: string | null } = { targetDate: target };
          if (deadlinePassed) input.deadline = removeDeadline ? null : deadline;
          run(() => continueQuestAction(quest.id, input, reason, localToday()), onDone);
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          New target date
          <input type="date" className={field} value={target} min={today} onChange={(e) => setTarget(e.target.value)} required />
        </label>
        {deadlinePassed && (
          <fieldset className="flex flex-col gap-2 rounded-sm border border-stone-700 p-3">
            <legend className="px-1 text-sm text-text-secondary">The hard deadline ({formatIsoDate(quest.deadline!)}) has passed</legend>
            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              New hard deadline
              <input type="date" className={field} value={deadline} min={target} disabled={removeDeadline} onChange={(e) => setDeadline(e.target.value)} required={!removeDeadline} />
            </label>
            <label className="flex items-center gap-2 text-text-primary">
              <input type="checkbox" className="size-4 accent-[var(--color-gold-400)]" checked={removeDeadline} onChange={(e) => setRemoveDeadline(e.target.checked)} />
              There is no real deadline anymore
            </label>
          </fieldset>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <GameButton onClick={onClose}>Cancel</GameButton>
          <GameButton type="submit" variant="primary" disabled={pending}>
            Continue Quest
          </GameButton>
        </div>
      </form>
    </GameDialog>
  );
}
