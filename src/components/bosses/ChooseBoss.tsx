"use client";

import { useState, useTransition } from "react";
import { bossAction } from "@/app/(realm)/quests/actions";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { DifficultyBadge } from "@/components/quests/DifficultyBadge";
import { GameButton } from "@/components/ui/GameButton";
import { Notice } from "@/components/ui/Notice";
import type { QuestSummary } from "@/server/queries/quests";

export function ChooseBoss({ candidates, hasBoss }: { candidates: QuestSummary[]; hasBoss: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (candidates.length === 0) {
    return <p className="mt-3 text-text-secondary">Accept a Quest first — your biggest one makes the best Boss.</p>;
  }
  return (
    <div className="mt-3">
      {error && <Notice tone="error" className="mb-2">{error}</Notice>}
      <ul className="flex flex-col gap-2">
        {candidates.map((q) => (
          <li key={q.id} className="q-tile flex items-center gap-3 p-2.5">
            <SkillIcon icon={q.icon} size={30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-text-primary">{q.title}</p>
              <DifficultyBadge difficulty={q.difficulty} />
            </div>
            <GameButton
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await bossAction(q.id, "designate");
                  if (!r.ok) setError(r.error);
                })
              }
            >
              {hasBoss ? "Make Boss" : "Choose as Boss"}
            </GameButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
