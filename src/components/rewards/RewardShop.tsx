"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  addRewardTemplateAction,
  createRewardAction,
  redeemRewardAction,
  removeRewardAction,
  setRewardActiveAction,
  updateRewardAction,
} from "@/app/(realm)/reward-shop/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { Badge } from "@/components/ui/Badge";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameButton } from "@/components/ui/GameButton";
import { GameDialog } from "@/components/ui/GameDialog";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { RewardTemplate } from "@/game/content/reward-templates";
import { affordability, REWARD_CATEGORIES, REWARD_CATEGORY_LABELS, type RewardCategory } from "@/game/rewards";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { useAction } from "@/lib/use-action";

export type RewardView = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  gpCost: number;
  repeatable: boolean;
  active: boolean;
  estimatedValue: string | null;
  timesRedeemed: number;
};

type Balance = { gpBalance: number; lifetimeGpEarned: number; lifetimeGpSpent: number };
type HistoryEntry = { id: string; name: string; gpCost: number; redeemedAt: string };

const ICON_CHOICES = ["shop", "combat", "gp", "world", "skill-creator", "skill-fitness", "skill-home", "skill-focus", "collection", "character"];

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

function newRequestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function RewardShop({ balance, rewards, history, templates }: { balance: Balance; rewards: RewardView[]; history: HistoryEntry[]; templates: RewardTemplate[] }) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const [category, setCategory] = useState<RewardCategory | "ALL">("ALL");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<RewardView | "new" | null>(null);
  const [confirm, setConfirm] = useState<{ reward: RewardView; requestId: string } | null>(null);
  const [redeemed, setRedeemed] = useState<{ name: string; gpCost: number; gpBalance: number } | null>(null);

  const active = rewards.filter((r) => r.active);
  const archived = rewards.filter((r) => !r.active);
  const categories = useMemo(() => REWARD_CATEGORIES.filter((c) => active.some((r) => r.category === c)), [active]);
  const shown = (showArchived ? archived : active).filter((r) => category === "ALL" || r.category === category);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <GamePanel as="section" surface="timber" aria-label="Your treasury" className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
          <CurrencyDisplay kind="GP" value={balance.gpBalance} variant="stacked" />
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-text-muted">Lifetime earned</dt>
              <dd className="font-bold tabular-nums text-text-primary">{formatNumber(balance.lifetimeGpEarned)} GP</dd>
            </div>
            <div>
              <dt className="text-text-muted">Lifetime spent</dt>
              <dd className="font-bold tabular-nums text-text-primary">{formatNumber(balance.lifetimeGpSpent)} GP</dd>
            </div>
          </dl>
          <GameButton variant="primary" className="ml-auto" icon={<PixelIcon name="shop" size={20} />} onClick={() => setEditing("new")}>
            Add Reward
          </GameButton>
          <p className="w-full text-sm text-text-secondary">
            Rewards are extras you choose to celebrate with. Rest, meals, time with people, and ordinary downtime never need GP.
          </p>
        </GamePanel>

        {error && <Notice tone="error">{error}</Notice>}

        {rewards.length === 0 ? (
          <GamePanel surface="parchment" className="p-4">
            <EmptyState
              tone="parchment"
              icon={<PixelIcon name="shop" size={48} />}
              title="Your Reward Shop is empty."
              message="Add something worth fighting for."
              action={
                <GameButton variant="primary" onClick={() => setEditing("new")}>
                  Add Your First Reward
                </GameButton>
              }
            />
          </GamePanel>
        ) : (
          <GamePanel as="section" aria-labelledby="shop-shelf" className="p-4">
            <SectionHeader id="shop-shelf" title={showArchived ? "Archived Rewards" : "Rewards"} icon={<PixelIcon name="shop" size={24} />} />
            <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by category">
              {(["ALL", ...categories] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={cx(
                    "min-h-9 rounded-sm border px-3 text-sm",
                    category === c ? "border-gold-500 bg-gold-700/25 text-gold-100" : "border-stone-700 text-text-secondary hover:border-stone-500",
                  )}
                >
                  {c === "ALL" ? "All" : REWARD_CATEGORY_LABELS[c]}
                </button>
              ))}
              {archived.length > 0 && (
                <button
                  type="button"
                  aria-pressed={showArchived}
                  onClick={() => setShowArchived((v) => !v)}
                  className="ml-auto min-h-9 rounded-sm border border-stone-700 px-3 text-sm text-text-secondary hover:border-stone-500"
                >
                  {showArchived ? "Show available" : `Archived (${archived.length})`}
                </button>
              )}
            </div>
            {shown.length === 0 ? (
              <p className="mt-4 text-text-secondary">Nothing on this shelf.</p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {shown.map((r) => {
                  const a = affordability(balance.gpBalance, r.gpCost);
                  return (
                    <li key={r.id} className="q-well flex flex-col gap-3 border border-border-dark p-3">
                      <div className="flex items-start gap-3">
                        <SkillIcon icon={r.icon} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="q-title text-lg leading-tight text-text-primary">{r.name}</p>
                          <p className="text-xs uppercase tracking-wider text-text-muted">
                            {REWARD_CATEGORY_LABELS[r.category as RewardCategory] ?? r.category}
                            {r.estimatedValue ? ` · ${r.estimatedValue}` : ""}
                          </p>
                        </div>
                      </div>
                      {r.description && <p className="text-sm text-text-secondary">{r.description}</p>}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-bold text-gold-200">
                          <PixelIcon name="gp" size={18} /> {formatNumber(r.gpCost)} GP
                        </span>
                        {r.active &&
                          (a.affordable ? (
                            <Badge tone="moss">✓ Affordable</Badge>
                          ) : (
                            <Badge tone="stone">Need {formatNumber(a.shortfall)} more GP</Badge>
                          ))}
                        {!r.repeatable && <Badge tone="blue">One-time</Badge>}
                        {r.timesRedeemed > 0 && <span className="text-xs text-text-muted">Redeemed {r.timesRedeemed}×</span>}
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        {r.active ? (
                          <>
                            <GameButton
                              variant="primary"
                              size="sm"
                              disabled={!a.affordable || pending}
                              aria-describedby={!a.affordable ? `short-${r.id}` : undefined}
                              onClick={() => setConfirm({ reward: r, requestId: newRequestId() })}
                            >
                              Claim Reward
                            </GameButton>
                            {!a.affordable && (
                              <span id={`short-${r.id}`} className="sr-only">
                                You need {a.shortfall} more GP.
                              </span>
                            )}
                            <GameButton size="sm" onClick={() => setEditing(r)}>
                              Edit
                            </GameButton>
                            <GameButton
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() => run<unknown>(() => (r.timesRedeemed > 0 ? setRewardActiveAction(r.id, false) : removeRewardAction(r.id)), () => router.refresh())}
                            >
                              {r.timesRedeemed > 0 ? "Archive" : "Remove"}
                            </GameButton>
                          </>
                        ) : (
                          r.repeatable && (
                            <GameButton size="sm" disabled={pending} onClick={() => run(() => setRewardActiveAction(r.id, true), () => router.refresh())}>
                              Restore
                            </GameButton>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </GamePanel>
        )}

        {templates.length > 0 && (
          <GamePanel as="section" aria-labelledby="reward-ideas" className="p-4">
            <SectionHeader id="reward-ideas" title="Reward Ideas" eyebrow="Add, then make them yours" icon={<PixelIcon name="collection" size={22} />} />
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {templates.map((t) => (
                <li key={t.key} className="flex items-center gap-3 rounded-sm border border-stone-700 px-3 py-2">
                  <SkillIcon icon={t.icon} size={24} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-text-primary">{t.name}</span>
                    <span className="text-xs text-text-muted">{t.gpCost} GP</span>
                  </span>
                  <GameButton size="sm" disabled={pending} onClick={() => run(() => addRewardTemplateAction(t.key), () => router.refresh())}>
                    Add
                  </GameButton>
                </li>
              ))}
            </ul>
          </GamePanel>
        )}
      </div>

      <GamePanel as="section" aria-labelledby="redemption-history" className="p-4">
        <SectionHeader id="redemption-history" title="Redemption History" icon={<PixelIcon name="diaries" size={22} />} />
        {history.length === 0 ? (
          <p className="mt-3 text-text-secondary">No rewards claimed yet. The first one is always the sweetest.</p>
        ) : (
          <ol className="mt-3 flex flex-col divide-y divide-stone-800">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-text-primary">{h.name}</span>
                  <span className="text-xs text-text-muted">
                    <LocalDate iso={h.redeemedAt} options={{ month: "short", day: "numeric", year: "numeric" }} />
                  </span>
                </span>
                <span className="shrink-0 font-bold tabular-nums text-gold-200">−{formatNumber(h.gpCost)} GP</span>
              </li>
            ))}
          </ol>
        )}
      </GamePanel>

      {editing && (
        <RewardForm
          reward={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <GameDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Claim this reward?"
        description={confirm ? `${confirm.reward.name} costs ${formatNumber(confirm.reward.gpCost)} GP.` : undefined}
      >
        {confirm && (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-text-secondary">
              Balance after claiming: <span className="font-bold text-gold-200">{formatNumber(balance.gpBalance - confirm.reward.gpCost)} GP</span>
            </p>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex justify-end gap-2">
              <GameButton onClick={() => setConfirm(null)}>Not yet</GameButton>
              <GameButton
                variant="primary"
                disabled={pending}
                onClick={() =>
                  run(
                    () => redeemRewardAction(confirm.reward.id, confirm.requestId),
                    (d) => {
                      setConfirm(null);
                      setRedeemed({ name: d.rewardName, gpCost: d.gpCost, gpBalance: d.gpBalance });
                      router.refresh();
                    },
                  )
                }
              >
                {pending ? "Claiming…" : `Spend ${formatNumber(confirm.reward.gpCost)} GP`}
              </GameButton>
            </div>
          </div>
        )}
      </GameDialog>

      <Dialog.Root open={Boolean(redeemed)} onOpenChange={(o) => !o && setRedeemed(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-void/80" />
          <Dialog.Content className="q-parchment q-frame-gold q-enter fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 p-6 text-center focus:outline-none">
            <div aria-hidden className="mx-auto flex size-14 items-center justify-center rounded-full border-4 border-gold-500 bg-gold-200/60 shadow-[0_0_24px_rgb(219_167_63/0.6)]">
              <PixelIcon name="shop" size={30} />
            </div>
            <Dialog.Title className="q-title mt-3 text-display-md text-parchment-ink">Reward Redeemed!</Dialog.Title>
            <Dialog.Description className="mt-1 text-parchment-ink-soft">
              {redeemed?.name} — earned through your Quests. Enjoy it.
            </Dialog.Description>
            <p className="mt-3 text-sm text-parchment-ink">
              −{formatNumber(redeemed?.gpCost ?? 0)} GP · {formatNumber(redeemed?.gpBalance ?? 0)} GP remaining
            </p>
            <Dialog.Close asChild>
              <GameButton variant="primary" className="mt-4 min-w-40">
                Continue
              </GameButton>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function RewardForm({ reward, onClose, onSaved }: { reward: RewardView | null; onClose: () => void; onSaved: () => void }) {
  const { pending, error, run } = useAction();
  const [name, setName] = useState(reward?.name ?? "");
  const [description, setDescription] = useState(reward?.description ?? "");
  const [category, setCategory] = useState<string>(reward?.category ?? "GAMING");
  const [icon, setIcon] = useState(reward?.icon ?? "shop");
  const [gpCost, setGpCost] = useState(String(reward?.gpCost ?? 20));
  const [repeatable, setRepeatable] = useState(reward?.repeatable ?? true);
  const [estimatedValue, setEstimatedValue] = useState(reward?.estimatedValue ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name, description, category, icon, gpCost: Number(gpCost), repeatable, estimatedValue: estimatedValue || null };
    run<unknown>(() => (reward ? updateRewardAction(reward.id, input) : createRewardAction(input)), onSaved);
  }

  return (
    <GameDialog open onOpenChange={(o) => !o && onClose()} title={reward ? "Edit Reward" : "Add a Reward"} description="Something real you want, priced in GP you earn from Quests.">
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 overflow-y-auto">
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Name
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required placeholder="Gaming Afternoon" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Description <span className="text-text-muted">(optional)</span>
          <textarea className={field} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Category
            <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
              {REWARD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {REWARD_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            GP cost
            <input className={field} type="number" inputMode="numeric" min={1} step={1} value={gpCost} onChange={(e) => setGpCost(e.target.value)} required />
          </label>
        </div>
        <fieldset className="flex flex-col gap-1 text-sm text-text-secondary">
          <legend>Icon</legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {ICON_CHOICES.map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={icon === i}
                aria-label={`Icon: ${i.replace("skill-", "")}`}
                onClick={() => setIcon(i)}
                className={cx("rounded-sm border p-1", icon === i ? "border-gold-400 bg-gold-700/30" : "border-stone-700 hover:border-stone-500")}
              >
                <PixelIcon name={i as never} size={24} />
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Real-world value <span className="text-text-muted">(optional, e.g. “$60”)</span>
          <input className={field} value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} maxLength={40} />
        </label>
        <label className="flex items-center gap-2 text-text-primary">
          <input type="checkbox" className="size-4 accent-[var(--color-gold-400)]" checked={repeatable} onChange={(e) => setRepeatable(e.target.checked)} />
          Can be claimed more than once
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="mt-1 flex justify-end gap-2">
          <GameButton onClick={onClose}>Cancel</GameButton>
          <GameButton type="submit" variant="primary" disabled={pending}>
            {reward ? "Save Reward" : "Add to Shop"}
          </GameButton>
        </div>
      </form>
    </GameDialog>
  );
}
