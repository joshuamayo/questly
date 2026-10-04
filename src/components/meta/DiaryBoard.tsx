"use client";

import { useId, useState, useTransition } from "react";
import { addDiaryEntryAction, claimDiaryTierAction, removeDiaryEntryAction, setDiaryEntryDoneAction } from "@/app/(realm)/achievement-diaries/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { GameButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DIARY_TIER_LABELS } from "@/game/diaries";
import { DIARY_TIERS, type DiaryTier } from "@/game/vocabulary";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { localToday } from "@/lib/dates";
import type { DiaryView } from "@/server/diaries/service";
import { TierShield, tierColor } from "./TierBadge";

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

export function DiaryBoard({ weekly, monthly, daysLeft }: { weekly: DiaryView; monthly: DiaryView; daysLeft: { WEEKLY: number; MONTHLY: number } }) {
  const ids = useId();
  const [tab, setTab] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTier, setNewTier] = useState<DiaryTier>("EASY");
  const [pending, startTransition] = useTransition();
  const diary = tab === "WEEKLY" ? weekly : monthly;
  const done = diary.entries.filter((e) => e.complete).length;

  function act<T>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, onOk?: (d: T) => void) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) onOk?.(r.data);
      else setError(r.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="q-stone q-frame flex flex-wrap gap-1.5 p-1.5" role="tablist" aria-label="Diary period">
        {(["WEEKLY", "MONTHLY"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            aria-controls={`${ids}-panel`}
            onClick={() => setTab(t)}
            className={cx("flex min-h-11 items-center gap-2 rounded-sm border px-4", tab === t ? "border-gold-500 bg-gold-700/25 text-gold-100" : "border-stone-700 text-text-primary hover:border-stone-500")}
          >
            <PixelIcon name="diaries" size={20} />
            {t === "WEEKLY" ? "Weekly Diary" : "Monthly Diary"}
          </button>
        ))}
      </div>

      <div id={`${ids}-panel`} role="tabpanel" className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <GamePanel as="section" surface="parchment" aria-label={diary.period.label} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div aria-hidden className="flex h-24 w-20 shrink-0 items-center justify-center bg-crimson-500 [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]">
                <PixelIcon name="diaries" size={40} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold uppercase tracking-wider text-parchment-ink-soft">{tab === "WEEKLY" ? "Weekly Diary" : "Monthly Diary"}</p>
                <h2 className="q-title text-display-md leading-tight text-parchment-ink">{diary.period.label}</h2>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar className="flex-1" tone="moss" value={diary.entries.length ? (done / diary.entries.length) * 100 : 0} label="Diary progress" valueText={`${done} of ${diary.entries.length} entries`} />
                  <span className="text-sm font-bold text-parchment-ink">
                    {done} / {diary.entries.length}
                  </span>
                </div>
                <p className="mt-1 text-sm text-parchment-ink-soft">
                  {daysLeft[tab]} day{daysLeft[tab] === 1 ? "" : "s"} remaining · {diary.completedTiers} of 4 tiers claimed
                </p>
              </div>
            </div>
          </GamePanel>

          {error && <Notice tone="error">{error}</Notice>}
          {notice && <Notice tone="success">{notice}</Notice>}

          {diary.tiers.map((tier) => {
            const entries = diary.entries.filter((e) => e.tier === tier.tier);
            return (
              <GamePanel key={tier.tier} as="section" aria-label={`${DIARY_TIER_LABELS[tier.tier]} tier`} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <TierShield tier={tier.tier} size={28} />
                  <h3 className="q-title text-xl" style={{ color: tierColor(tier.tier) }}>
                    {DIARY_TIER_LABELS[tier.tier]} Tier
                  </h3>
                  <span className="text-sm text-text-secondary">
                    {tier.done} / {tier.total}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 text-sm">
                    {tier.claimed ? (
                      <span className="text-moss-300">✓ Claimed</span>
                    ) : tier.complete ? (
                      <span className="text-gold-200">Complete — ready to claim</span>
                    ) : (
                      <span className="text-text-muted">In progress</span>
                    )}
                  </span>
                </div>
                <ProgressBar className="mt-2" color={tierColor(tier.tier)} value={tier.total ? (tier.done / tier.total) * 100 : 0} label={`${DIARY_TIER_LABELS[tier.tier]} tier progress`} valueText={`${tier.done} of ${tier.total}`} />
                <ul className="mt-3 flex flex-col gap-1.5">
                  {entries.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 rounded-sm border border-stone-700 px-3 py-2">
                      {e.kind === "CUSTOM" ? (
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={e.complete}
                          aria-label={`${e.complete ? "Mark incomplete" : "Mark complete"}: ${e.title}`}
                          disabled={pending || tier.claimed}
                          onClick={() => act(() => setDiaryEntryDoneAction(e.id, !e.complete))}
                          className={cx("flex size-6 shrink-0 items-center justify-center rounded-xs border-2 text-xs", e.complete ? "border-moss-400 bg-moss-600 text-white" : "border-stone-500")}
                        >
                          {e.complete ? "✓" : ""}
                        </button>
                      ) : (
                        <span aria-hidden className={cx("flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs", e.complete ? "border-moss-400 bg-moss-600 text-white" : "border-stone-600")}>
                          {e.complete ? "✓" : ""}
                        </span>
                      )}
                      <span className={cx("flex-1", e.complete ? "text-text-secondary" : "text-text-primary")}>
                        {e.title}
                        {e.kind === "CUSTOM" && <span className="ml-2 text-xs text-text-muted">(your entry)</span>}
                      </span>
                      {e.kind === "AUTO" && (
                        <span className="text-sm tabular-nums text-text-secondary">
                          {formatNumber(e.progress.current)}/{formatNumber(e.progress.target)}
                        </span>
                      )}
                      {e.kind === "CUSTOM" && !tier.claimed && (
                        <button type="button" aria-label={`Remove ${e.title}`} className="text-text-muted hover:text-crimson-300" onClick={() => act(() => removeDiaryEntryAction(e.id))}>
                          ✕
                        </button>
                      )}
                      <span className="sr-only">{e.complete ? "(complete)" : "(not complete)"}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                    Reward: <PixelIcon name="gp" size={16} /> +{tier.reward.gp} GP · <SkillIcon icon="skill-focus" size={16} framed={false} /> +{tier.reward.focusXp} Focus XP
                  </span>
                  {!tier.claimed && (
                    <GameButton
                      variant={tier.claimable ? "primary" : "secondary"}
                      size="sm"
                      className="ml-auto"
                      disabled={pending || !tier.claimable}
                      onClick={() =>
                        act(() => claimDiaryTierAction(tab, tier.tier, localToday()), (r) =>
                          setNotice(`Diary Tier Complete! ${DIARY_TIER_LABELS[tier.tier]}: +${r.reward.gp} GP, +${r.reward.focusXp} Focus XP${r.levelUp ? ` — Focus reached Level ${r.levelUp.toLevel}!` : ""}${r.shield ? " A Streak Shield was earned." : ""}`),
                        )
                      }
                    >
                      {tier.claimable ? "Claim Reward" : tier.complete ? "Claim lower tiers first" : "Claim Reward"}
                    </GameButton>
                  )}
                </div>
              </GamePanel>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <GamePanel as="section" aria-label="Add a Diary entry" className="p-4">
            <p className="q-title text-xl text-gold-300">Add Your Own Entry</p>
            <p className="mt-1 text-sm text-text-secondary">Write a goal for this {tab === "WEEKLY" ? "week" : "month"} — like “Finish the landscaping project.”</p>
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                act(() => addDiaryEntryAction(tab, newTier, newTitle, localToday()), () => setNewTitle(""));
              }}
            >
              <label htmlFor={`${ids}-entry`} className="sr-only">
                Entry
              </label>
              <input id={`${ids}-entry`} className={field} value={newTitle} maxLength={200} placeholder="Diary entry…" onChange={(e) => setNewTitle(e.target.value)} />
              <div className="flex gap-2">
                <label htmlFor={`${ids}-tier`} className="sr-only">
                  Tier
                </label>
                <select id={`${ids}-tier`} className={field} value={newTier} onChange={(e) => setNewTier(e.target.value as DiaryTier)}>
                  {DIARY_TIERS.filter((t) => !diary.tiers.find((x) => x.tier === t)?.claimed).map((t) => (
                    <option key={t} value={t}>
                      {DIARY_TIER_LABELS[t]}
                    </option>
                  ))}
                </select>
                <GameButton type="submit" variant="secondary" disabled={pending || !newTitle.trim()}>
                  Add
                </GameButton>
              </div>
            </form>
          </GamePanel>
          <GamePanel as="section" aria-label="How Diaries work" className="p-4">
            <p className="q-title text-xl text-gold-300">How Diaries Work</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-text-secondary">
              <li>Entries track themselves from your Quests, Focus sessions, and Bosses this {tab === "WEEKLY" ? "week" : "month"}.</li>
              <li>Finish every entry in a tier, then claim its reward — Easy first, Elite last.</li>
              <li>Each tier is claimed once per Diary. A new Diary begins each {tab === "WEEKLY" ? "week" : "month"}.</li>
            </ul>
          </GamePanel>
        </div>
      </div>
    </div>
  );
}
