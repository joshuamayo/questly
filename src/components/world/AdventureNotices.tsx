"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { dismissRespawnAction } from "@/app/(realm)/respawn/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { GameButton, GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { useAction } from "@/lib/use-action";

/**
 * World prompts that keep the adventure on course — a Respawn suggestion,
 * Quests needing a decision, weekly planning. Calm, dismissible, never a
 * red overdue counter.
 */
export function AdventureNotices({
  respawn,
  attentionCount,
  planningDue,
  inRecovery,
  justRespawned,
}: {
  respawn: { suggested: boolean; trigger: string | null; missedWorkdays: number; questsNeedingAttention: number };
  attentionCount: number;
  planningDue: boolean;
  inRecovery: boolean;
  justRespawned: boolean;
}) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const any = respawn.suggested || attentionCount > 0 || planningDue || inRecovery || justRespawned;
  if (!any) return null;

  return (
    <div className="flex flex-col gap-2">
      {justRespawned && <Notice tone="success">You respawned. Nothing permanent was lost — one clear win and the adventure rolls on.</Notice>}
      {respawn.suggested && (
        <GamePanel as="section" aria-labelledby="respawn-prompt" className="flex flex-col gap-3 border-crimson-500/60 p-4 sm:flex-row sm:items-center">
          <PixelIcon name="character" size={32} />
          <div className="min-w-0 flex-1">
            <p id="respawn-prompt" className="q-title text-xl text-crimson-300">
              Your adventure has stalled
            </p>
            <p className="text-sm text-text-secondary">
              {respawn.trigger === "MISSED_WORKDAYS"
                ? `${respawn.missedWorkdays} adventuring days have passed quietly.`
                : `${respawn.questsNeedingAttention} Quests have drifted past their dates.`}{" "}
              A Respawn clears the path. Nothing permanent is lost.
            </p>
            {error && <Notice tone="error" className="mt-2">{error}</Notice>}
          </div>
          <div className="flex gap-2">
            <GameLinkButton href="/respawn" variant="primary">
              Respawn
            </GameLinkButton>
            <GameButton disabled={pending} onClick={() => run(() => dismissRespawnAction(), () => router.refresh())}>
              Not now
            </GameButton>
          </div>
        </GamePanel>
      )}
      <div className="flex flex-wrap gap-2">
        {attentionCount > 0 && !respawn.suggested && (
          <Link href="/quests" className="q-stone q-frame flex min-h-11 items-center gap-2 px-3 text-sm text-text-primary hover:text-gold-200">
            <PixelIcon name="quests" size={18} />
            {attentionCount === 1 ? "1 Quest needs a decision" : `${attentionCount} Quests need a decision`} →
          </Link>
        )}
        {planningDue && (
          <Link href="/planning" className="q-stone q-frame flex min-h-11 items-center gap-2 px-3 text-sm text-text-primary hover:text-gold-200">
            <PixelIcon name="world" size={18} />
            Prepare this week&apos;s adventure →
          </Link>
        )}
        {inRecovery && (
          <span className="q-stone q-frame flex min-h-11 items-center gap-2 px-3 text-sm text-moss-300">
            <PixelIcon name="skill-focus" size={18} />
            Recovery week — one Quest at a time.
          </span>
        )}
      </div>
    </div>
  );
}
