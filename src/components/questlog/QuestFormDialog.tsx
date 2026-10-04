"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { GameButton } from "@/components/ui/GameButton";
import { GameDialog } from "@/components/ui/GameDialog";
import { Notice } from "@/components/ui/Notice";
import { GP_QUICK_CHOICES, QUEST_LIMITS, type InsertPosition } from "@/game/quests";
import { cx } from "@/lib/cx";

export const field =
  "w-full rounded-sm border border-parchment-400 bg-parchment-50 px-3 py-2 text-parchment-ink placeholder:text-parchment-ink-soft/70 focus:border-gold-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

export type QuestFormValues = { title: string; description: string; gpReward: number; position: InsertPosition };

/**
 * Add Quest / Edit Quest. Only the title is required: type it, press Enter,
 * and the Quest lands at the end of the log (spec §12–13).
 */
export function QuestFormDialog({
  mode,
  initial,
  defaultGp,
  hasCurrent,
  pending,
  error,
  onSubmit,
  onRemove,
  onClose,
}: {
  mode: "add" | "edit";
  initial?: { title: string; description: string; gpReward: number };
  defaultGp: number;
  hasCurrent: boolean;
  pending: boolean;
  error: string | null;
  onSubmit: (values: QuestFormValues) => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [gp, setGp] = useState(String(initial?.gpReward ?? defaultGp));
  const [position, setPosition] = useState<InsertPosition>("end");
  const gpNumber = Number(gp);

  return (
    <GameDialog open onOpenChange={(o) => !o && onClose()} title={mode === "add" ? "Add Quest" : "Edit Quest"} tone="parchment">
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ title, description, gpReward: gp === "" ? defaultGp : gpNumber, position });
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-bold text-parchment-ink">
          Quest Title
          <input
            className={field}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={QUEST_LIMITS.titleMax}
            placeholder="e.g. Write next YouTube script"
            required
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-parchment-ink">
          <span>
            Description <span className="font-normal text-parchment-ink-soft">(optional)</span>
          </span>
          <textarea
            className={cx(field, "min-h-20")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={QUEST_LIMITS.descriptionMax}
            placeholder="Add details, notes, or a checklist…"
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-bold text-parchment-ink">Reward (GP)</legend>
          <div className="flex items-center gap-2">
            <PixelIcon name="gp" size={24} />
            <input
              className={cx(field, "max-w-28 tabular-nums")}
              type="number"
              inputMode="numeric"
              min={0}
              max={QUEST_LIMITS.gpMax}
              step={1}
              value={gp}
              onChange={(e) => setGp(e.target.value)}
              aria-label="GP reward"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick GP choices">
            {GP_QUICK_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={gpNumber === n}
                onClick={() => setGp(String(n))}
                className={cx(
                  "min-h-9 min-w-12 rounded-sm border px-3 font-bold tabular-nums",
                  gpNumber === n ? "border-gold-600 bg-gold-200 text-parchment-ink" : "border-parchment-400 text-parchment-ink-soft hover:border-gold-500",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        {mode === "add" && (
          <label className="flex flex-col gap-1 text-sm font-bold text-parchment-ink">
            Insert Position
            <select className={field} value={position} onChange={(e) => setPosition(e.target.value as InsertPosition)}>
              <option value="end">Add to end of list</option>
              {hasCurrent && <option value="next">Up next (after the Current Quest)</option>}
              <option value="top">{hasCurrent ? "Top — make it the Current Quest" : "Top of the list"}</option>
            </select>
          </label>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap items-center gap-2">
          {onRemove && (
            <GameButton type="button" variant="ghost" className="mr-auto text-crimson-500 hover:text-crimson-700" disabled={pending} onClick={onRemove}>
              Remove from Quest Log
            </GameButton>
          )}
          <div className="ml-auto flex gap-2">
            <GameButton type="button" onClick={onClose}>
              Cancel
            </GameButton>
            <GameButton type="submit" variant="success" disabled={pending}>
              {mode === "add" ? "Add Quest" : "Save Quest"}
            </GameButton>
          </div>
        </div>
      </form>
    </GameDialog>
  );
}
