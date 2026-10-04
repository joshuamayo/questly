"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { useCallback, useRef, useState, useTransition } from "react";
import {
  addSuggestedRewardsAction,
  createRewardAction,
  redeemRewardAction,
  setFeaturedGoalAction,
  setRewardActiveAction,
  updateRewardAction,
} from "@/app/(realm)/reward-shop/actions";
import { IconTile } from "@/components/icons/IconTile";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { field } from "@/components/questlog/QuestFormDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameButton } from "@/components/ui/GameButton";
import { GameDialog } from "@/components/ui/GameDialog";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { Notice } from "@/components/ui/Notice";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { affordability, REWARD_ICONS } from "@/game/rewards";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { playChime } from "@/lib/sound";

export type RewardView = {
  id: string;
  name: string;
  description: string;
  icon: string;
  gpCost: number;
  repeatable: boolean;
  active: boolean;
  featuredGoal: boolean;
  timesRedeemed: number;
};
type HistoryEntry = { id: string; name: string; gpCost: number; redeemedAt: string };
type Tab = "all" | "available" | "saving" | "redeemed";
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All Rewards" },
  { key: "available", label: "Available" },
  { key: "saving", label: "Not Yet Affordable" },
  { key: "redeemed", label: "Redeemed" },
];

function newRequestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function RewardShop({
  gpBalance,
  rewards,
  history,
  celebrate,
  sound,
}: {
  gpBalance: number;
  rewards: RewardView[];
  history: HistoryEntry[];
  celebrate: boolean;
  sound: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<RewardView | "new" | null>(null);
  const [confirm, setConfirm] = useState<{ reward: RewardView; requestId: string } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<{ name: string; gpCost: number; gpBalance: number } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastId = useRef(0);
  const notify = useCallback((message: string, extra: Partial<ToastState> = {}) => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, ...extra });
  }, []);
  const dismiss = useCallback(() => setToast(null), []);

  function run<T>(fn: () => Promise<Result<T>>, onOk?: (d: T) => void) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) onOk?.(r.data);
      else notify(r.error, { tone: "error" });
    });
  }

  const active = rewards.filter((r) => r.active);
  const archived = rewards.filter((r) => !r.active);
  const visible = (showArchived ? archived : active).filter((r) =>
    tab === "available" ? gpBalance >= r.gpCost : tab === "saving" ? gpBalance < r.gpCost : true,
  );

  if (rewards.length === 0) {
    return (
      <>
        <GamePanel surface="parchment" className="p-6">
          <EmptyState
            tone="parchment"
            icon={<PixelIcon name="collection" size={56} />}
            title="Your Reward Shop is empty."
            message="Add something worth working toward."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <GameButton variant="success" onClick={() => setEditing("new")}>
                  Add Custom Reward
                </GameButton>
                <GameButton disabled={pending} onClick={() => run(() => addSuggestedRewardsAction(), () => notify("Added six starter rewards. Edit or archive any of them."))}>
                  Start with suggested rewards
                </GameButton>
              </div>
            }
          />
        </GamePanel>
        {editing && <RewardForm reward={null} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />}
        <Toast toast={toast} onDismiss={dismiss} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="q-stone q-frame flex flex-wrap gap-1.5 p-1.5" role="tablist" aria-label="Reward views">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "min-h-10 rounded-sm border px-4 text-sm",
              tab === t.key ? "border-gold-500 bg-gold-700/25 text-gold-100" : "border-stone-700 text-text-primary hover:border-stone-500",
            )}
          >
            {t.label}
          </button>
        ))}
        {archived.length > 0 && tab !== "redeemed" && (
          <button
            type="button"
            aria-pressed={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className="ml-auto min-h-10 rounded-sm border border-stone-700 px-3 text-sm text-text-secondary hover:border-stone-500"
          >
            {showArchived ? "Show active rewards" : `Archived (${archived.length})`}
          </button>
        )}
      </div>

      {tab === "redeemed" ? (
        <GamePanel as="section" aria-label="Redemption history" className="p-4">
          {history.length === 0 ? (
            <p className="text-text-secondary">No rewards redeemed yet. The first one is always the sweetest.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-stone-800">
              {history.map((h) => (
                <li key={h.id} className="flex items-center gap-3 py-2.5">
                  <PixelIcon name="check" size={20} label="Redeemed" />
                  <span className="min-w-0 flex-1 truncate text-text-primary">{h.name}</span>
                  <span className="text-sm text-text-muted">
                    <LocalDate iso={h.redeemedAt} options={{ month: "short", day: "numeric", year: "numeric" }} />
                  </span>
                  <span className="w-20 text-right font-bold tabular-nums text-gold-200">−{formatNumber(h.gpCost)} GP</span>
                </li>
              ))}
            </ol>
          )}
        </GamePanel>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {visible.map((r) => {
            const a = affordability(gpBalance, r.gpCost);
            return (
              <li key={r.id} className={cx("q-parchment q-frame relative flex flex-col items-center gap-2 p-3 text-center", r.featuredGoal && "ring-2 ring-gold-400")}>
                {r.featuredGoal && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 text-xs font-bold text-parchment-ink">
                    <PixelIcon name="star" size={16} /> Saving for
                  </span>
                )}
                <RewardMenu
                  reward={r}
                  onEdit={() => setEditing(r)}
                  onFeature={() => run(() => setFeaturedGoalAction(r.featuredGoal ? null : r.id), () => notify(r.featuredGoal ? "Savings goal cleared." : `Now saving for “${r.name}”.`))}
                  onArchive={() => run(() => setRewardActiveAction(r.id, !r.active), () => notify(r.active ? `Archived “${r.name}”.` : `Restored “${r.name}”.`))}
                />
                <span className="mt-4">
                  <IconTile icon={r.icon} size={56} framed={false} />
                </span>
                <p className="q-title line-clamp-2 min-h-12 text-lg leading-tight text-parchment-ink">{r.name}</p>
                <p className="flex items-center gap-1.5 font-bold tabular-nums text-parchment-ink">
                  <PixelIcon name="gp" size={20} /> {formatNumber(r.gpCost)} GP
                </p>
                {!r.repeatable && <p className="text-xs text-parchment-ink-soft">One-time</p>}
                {r.active ? (
                  a.affordable ? (
                    <GameButton
                      variant="primary"
                      size="sm"
                      className="mt-auto w-full"
                      disabled={pending}
                      onClick={() => {
                        setConfirmError(null);
                        setConfirm({ reward: r, requestId: newRequestId() });
                      }}
                    >
                      Redeem
                    </GameButton>
                  ) : (
                    <p className="mt-auto flex min-h-9 w-full items-center justify-center gap-1.5 rounded-sm border border-parchment-400 text-sm text-parchment-ink-soft">
                      <PixelIcon name="lock" size={14} /> Need {formatNumber(a.shortfall)} more GP
                    </p>
                  )
                ) : (
                  <p className="mt-auto text-sm text-parchment-ink-soft">Archived</p>
                )}
              </li>
            );
          })}
          {!showArchived && (
            <li>
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="flex h-full min-h-56 w-full flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-stone-600 text-text-secondary hover:border-gold-500 hover:text-gold-200"
              >
                <span aria-hidden className="text-3xl">＋</span>
                Add Custom Reward
              </button>
            </li>
          )}
          {visible.length === 0 && showArchived && <li className="col-span-full text-text-secondary">Nothing archived.</li>}
        </ul>
      )}
      {tab !== "redeemed" && visible.length === 0 && !showArchived && (
        <p className="text-text-secondary">{tab === "available" ? "Nothing affordable yet — complete a few quests." : "You can afford everything here!"}</p>
      )}

      {editing && <RewardForm reward={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />}

      <GameDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Redeem this reward?"
        description={confirm ? `${confirm.reward.name} costs ${formatNumber(confirm.reward.gpCost)} GP.` : undefined}
      >
        {confirm && (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-text-secondary">
              GP after redeeming: <span className="font-bold text-gold-200">{formatNumber(gpBalance - confirm.reward.gpCost)} GP</span>
            </p>
            {confirmError && <Notice tone="error">{confirmError}</Notice>}
            <div className="flex justify-end gap-2">
              <GameButton onClick={() => setConfirm(null)}>Not yet</GameButton>
              <GameButton
                variant="primary"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await redeemRewardAction(confirm.reward.id, confirm.requestId);
                    if (!r.ok) return setConfirmError(r.error);
                    setConfirm(null);
                    if (sound) playChime("redeem");
                    if (celebrate) setRedeemed({ name: r.data.rewardName, gpCost: r.data.gpCost, gpBalance: r.data.gpBalance });
                    else notify(`Reward redeemed: ${r.data.rewardName} (−${r.data.gpCost} GP).`, { tone: "success" });
                  })
                }
              >
                {pending ? "Redeeming…" : `Spend ${formatNumber(confirm.reward.gpCost)} GP`}
              </GameButton>
            </div>
          </div>
        )}
      </GameDialog>

      <Dialog.Root open={Boolean(redeemed)} onOpenChange={(o) => !o && setRedeemed(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-void/80" />
          <Dialog.Content className="q-parchment q-frame-gold q-enter fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 p-6 text-center focus:outline-none">
            <div aria-hidden className="q-coin-pop mx-auto flex size-16 items-center justify-center rounded-full border-4 border-gold-500 bg-gold-200/60 shadow-[0_0_24px_rgb(219_167_63/0.6)]">
              <PixelIcon name="collection" size={34} />
            </div>
            <Dialog.Title className="q-title mt-3 text-display-md text-parchment-ink">Reward Redeemed!</Dialog.Title>
            <Dialog.Description className="mt-1 text-parchment-ink-soft">{redeemed?.name} — earned through your quests. Enjoy it.</Dialog.Description>
            <p className="mt-3 text-sm text-parchment-ink">
              −{formatNumber(redeemed?.gpCost ?? 0)} GP · {formatNumber(redeemed?.gpBalance ?? 0)} GP left
            </p>
            <Dialog.Close asChild>
              <GameButton variant="success" className="mt-4 min-w-40" autoFocus>
                Continue
              </GameButton>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

function RewardMenu({ reward, onEdit, onFeature, onArchive }: { reward: RewardView; onEdit: () => void; onFeature: () => void; onArchive: () => void }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`Options for ${reward.name}`} className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-sm text-parchment-ink-soft hover:bg-parchment-300/60">
        <span aria-hidden>⋯</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={4} className="q-stone q-frame z-50 min-w-48 p-1 text-sm">
          {reward.active && (
            <>
              <Item onSelect={onEdit}>Edit</Item>
              <Item onSelect={onFeature}>{reward.featuredGoal ? "Stop saving for this" : "Save for this"}</Item>
            </>
          )}
          {(reward.active || reward.repeatable || reward.timesRedeemed === 0) && <Item onSelect={onArchive}>{reward.active ? "Archive" : "Restore"}</Item>}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function Item({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Menu.Item onSelect={onSelect} className="flex min-h-9 cursor-pointer select-none items-center rounded-xs px-3 text-text-primary outline-none data-[highlighted]:bg-stone-700">
      {children}
    </Menu.Item>
  );
}

function RewardForm({ reward, onClose, onSaved }: { reward: RewardView | null; onClose: () => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(reward?.name ?? "");
  const [description, setDescription] = useState(reward?.description ?? "");
  const [icon, setIcon] = useState(reward?.icon ?? "gift");
  const [gpCost, setGpCost] = useState(String(reward?.gpCost ?? 25));
  const [repeatable, setRepeatable] = useState(reward?.repeatable ?? true);

  return (
    <GameDialog open onOpenChange={(o) => !o && onClose()} title={reward ? "Edit Reward" : "Add Custom Reward"} tone="parchment">
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const input = { name, description, icon, gpCost: Number(gpCost), repeatable };
          startTransition(async () => {
            const r = reward ? await updateRewardAction(reward.id, input) : await createRewardAction(input);
            if (r.ok) onSaved();
            else setError(r.error);
          });
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-bold text-parchment-ink">
          Reward
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoFocus placeholder="e.g. Favorite Lunch" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-parchment-ink">
          <span>
            Description <span className="font-normal text-parchment-ink-soft">(optional)</span>
          </span>
          <textarea className={cx(field, "min-h-16")} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-parchment-ink">
          GP cost
          <span className="flex items-center gap-2">
            <PixelIcon name="gp" size={24} />
            <input className={cx(field, "max-w-32 tabular-nums")} type="number" inputMode="numeric" min={1} step={1} value={gpCost} onChange={(e) => setGpCost(e.target.value)} required />
          </span>
        </label>
        <fieldset>
          <legend className="text-sm font-bold text-parchment-ink">Icon</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {REWARD_ICONS.map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={icon === i}
                aria-label={`Icon: ${i}`}
                onClick={() => setIcon(i)}
                className={cx("rounded-sm border-2 p-1", icon === i ? "border-gold-600 bg-gold-200" : "border-parchment-400 hover:border-gold-500")}
              >
                <PixelIcon name={i} size={28} />
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-parchment-ink">
          <input type="checkbox" className="size-4 accent-[var(--color-gold-500)]" checked={repeatable} onChange={(e) => setRepeatable(e.target.checked)} />
          Can be redeemed more than once
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex justify-end gap-2">
          <GameButton onClick={onClose}>Cancel</GameButton>
          <GameButton type="submit" variant="success" disabled={pending}>
            {reward ? "Save Reward" : "Add Reward"}
          </GameButton>
        </div>
      </form>
    </GameDialog>
  );
}
