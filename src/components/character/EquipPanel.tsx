"use client";

import { useId, useState, useTransition } from "react";
import { equipCapeAction, equipTitleAction } from "@/app/(realm)/character/actions";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { cx } from "@/lib/cx";
import type { CapeView, TitleView } from "@/server/queries/meta";

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

/** Equip earned Titles and Skill Capes; locked ones show how to earn them. */
export function EquipPanel({
  titles,
  capes,
  equippedTitle,
  equippedCape,
}: {
  titles: TitleView[];
  capes: CapeView[];
  equippedTitle: string | null;
  equippedCape: string | null;
}) {
  const ids = useId();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Something went wrong."));
    });
  const earnedCapes = capes.filter((c) => c.unlocked);

  return (
    <GamePanel as="section" labelledBy={`${ids}-equip`} className="p-4">
      <SectionHeader id={`${ids}-equip`} icon={<PixelIcon name="character" size={22} />} title="Titles & Capes" divider />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-title`} className="mb-1 block text-sm font-bold text-gold-300">
            Current Title
          </label>
          <select id={`${ids}-title`} className={field} value={equippedTitle ?? ""} disabled={pending} onChange={(e) => run(() => equipTitleAction(e.target.value || null))}>
            <option value="">No title</option>
            {titles
              .filter((t) => t.owned)
              .map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${ids}-cape`} className="mb-1 block text-sm font-bold text-gold-300">
            Current Cape
          </label>
          <select id={`${ids}-cape`} className={field} value={equippedCape ?? ""} disabled={pending || earnedCapes.length === 0} onChange={(e) => run(() => equipCapeAction(e.target.value || null))}>
            <option value="">{earnedCapes.length ? "No cape" : "None earned yet (Level 99)"}</option>
            {earnedCapes.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {titles.map((t) => (
          <li key={t.key} className={cx("q-tile px-3 py-2", !t.owned && "opacity-80")}>
            <div className="flex items-center justify-between gap-2">
              <span className={t.owned ? "font-bold text-text-primary" : "text-text-secondary"}>{t.name}</span>
              {t.owned ? <span className="text-xs text-moss-300">✓ Earned</span> : <span className="flex items-center gap-1 text-xs text-text-muted"><PixelIcon name="lock" size={12} /> Locked</span>}
            </div>
            <p className="text-xs text-text-muted">{t.description}</p>
            {t.progress && (
              <ProgressBar className="mt-1" size="sm" tone="gold" value={t.progress.percent} label={`${t.name} progress`} valueText={`${t.progress.current} of ${t.progress.target}`} />
            )}
          </li>
        ))}
      </ul>
    </GamePanel>
  );
}
