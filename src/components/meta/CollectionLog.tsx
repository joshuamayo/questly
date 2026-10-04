"use client";

import { useId, useState, useTransition } from "react";
import { claimCollectionItemAction, setCollectionNoteAction } from "@/app/(realm)/collection-log/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { GameButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { Notice } from "@/components/ui/Notice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { COLLECTION_CATEGORIES, COLLECTION_CATEGORY_LABELS } from "@/game/content/collection";
import { cx } from "@/lib/cx";
import type { CollectionItemView } from "@/server/queries/meta";

const RARITY_LABEL: Record<string, string> = { COMMON: "Common", UNCOMMON: "Uncommon", RARE: "Rare", EPIC: "Epic", LEGENDARY: "Legendary" };
const rarityColor = (r: string) => `var(--color-rarity-${r.toLowerCase()})`;
const CATEGORY_ICON: Record<string, string> = {
  creator: "skill-creator",
  business: "skill-business",
  finance: "skill-finance",
  fitness: "skill-fitness",
  home: "skill-home",
  general: "world",
};

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

/** The Collection Log museum: category tabs, slot grid, and item detail. */
export function CollectionLog({ items }: { items: CollectionItemView[] }) {
  const ids = useId();
  const [category, setCategory] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "collected" | "uncollected">("all");
  const [selectedKey, setSelectedKey] = useState(items.find((i) => i.state === "UNLOCKED")?.key ?? items[0]?.key);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const inCategory = category === "all" ? items : items.filter((i) => i.category === category);
  const shown = inCategory.filter((i) => (filter === "all" ? true : filter === "collected" ? i.state === "UNLOCKED" : i.state !== "UNLOCKED"));
  const collected = items.filter((i) => i.state === "UNLOCKED").length;
  const selected = items.find((i) => i.key === selectedKey) ?? null;

  function select(item: CollectionItemView) {
    setSelectedKey(item.key);
    setNote(item.note);
    setError(null);
    setSaved(false);
    if (window.matchMedia("(max-width: 1279px)").matches) document.getElementById("collection-detail")?.scrollIntoView({ block: "start" });
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_22rem]">
      <GamePanel as="nav" aria-label="Collection categories" className="p-3">
        <SectionHeader title="Categories" level={3} icon={<PixelIcon name="collection" size={20} />} divider />
        <ul className="mt-2 flex flex-col gap-1">
          {["all", ...COLLECTION_CATEGORIES].map((c) => {
            const list = c === "all" ? items : items.filter((i) => i.category === c);
            const got = list.filter((i) => i.state === "UNLOCKED").length;
            return (
              <li key={c}>
                <button
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={cx(
                    "flex w-full items-center gap-2.5 rounded-sm border px-2.5 py-2 text-left",
                    category === c ? "border-blue-400 bg-blue-700/40" : "border-transparent hover:border-stone-600",
                  )}
                >
                  {c === "all" ? <PixelIcon name="collection" size={22} /> : <SkillIcon icon={CATEGORY_ICON[c]} size={22} framed={false} />}
                  <span className="flex-1 text-text-primary">{c === "all" ? "All Items" : COLLECTION_CATEGORY_LABELS[c as keyof typeof COLLECTION_CATEGORY_LABELS]}</span>
                  <span className="text-sm tabular-nums text-text-secondary">
                    {got}/{list.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </GamePanel>

      <GamePanel as="section" labelledBy={`${ids}-grid`} className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader id={`${ids}-grid`} icon={<PixelIcon name="collection" size={22} />} title={category === "all" ? "All Items" : COLLECTION_CATEGORY_LABELS[category as keyof typeof COLLECTION_CATEGORY_LABELS]} />
          <div className="flex min-w-48 flex-1 items-center gap-2 sm:max-w-xs">
            <ProgressBar className="flex-1" tone="moss" value={(collected / items.length) * 100} label="Collection completion" valueText={`${collected} of ${items.length}`} />
            <span className="text-sm tabular-nums text-text-secondary">
              {collected} / {items.length} ({Math.floor((collected / items.length) * 100)}%)
            </span>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label="Show">
          {(["all", "collected", "uncollected"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => setFilter(f)}
              className={cx("rounded-sm border px-3 py-1.5 text-sm", filter === f ? "border-blue-400 bg-blue-700/40 text-text-primary" : "border-stone-700 text-text-secondary")}
            >
              {f === "all" ? "All" : f === "collected" ? "Collected" : "Uncollected"}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="mt-6 text-center text-text-secondary">Nothing discovered here yet.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5" aria-label="Collection slots">
            {shown.map((item) => {
              const unlocked = item.state === "UNLOCKED";
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => select(item)}
                    aria-pressed={item.key === selectedKey}
                    aria-label={`${item.title}, ${RARITY_LABEL[item.rarity]}, ${unlocked ? "collected" : item.state === "SECRET" ? "secret" : "locked"}`}
                    className={cx(
                      "flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-sm border-2 p-2 text-center transition-[border-color,box-shadow]",
                      unlocked ? "bg-stone-850" : "bg-stone-950",
                      item.key === selectedKey ? "border-gold-400 shadow-glow-gold" : unlocked ? "border-stone-600 hover:border-stone-400" : "border-stone-800 hover:border-stone-600",
                    )}
                  >
                    <span className={cx(!unlocked && "opacity-40 brightness-0 invert-[0.25]")}>
                      {item.state === "SECRET" ? (
                        <span aria-hidden className="q-title text-4xl text-text-muted">?</span>
                      ) : (
                        <SkillIcon icon={item.icon} size={40} framed={false} />
                      )}
                    </span>
                    <span className={cx("line-clamp-2 text-sm leading-tight", unlocked ? "text-text-primary" : "text-text-muted")}>{item.title}</span>
                    <span
                      className="rounded-xs px-1.5 text-[0.65rem] font-bold uppercase tracking-wider"
                      style={unlocked ? { color: rarityColor(item.rarity), backgroundColor: `color-mix(in oklab, ${rarityColor(item.rarity)}, transparent 85%)` } : undefined}
                    >
                      {unlocked ? RARITY_LABEL[item.rarity] : item.state === "SECRET" ? "Secret" : "Locked"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </GamePanel>

      <div id="collection-detail" className="scroll-mt-20 xl:sticky xl:top-20">
        {selected && (
          <GamePanel as="section" labelledBy={`${ids}-detail`} className="p-5" aria-live="polite">
            <div
              className={cx(
                "flex aspect-[4/3] items-center justify-center rounded-sm border-2",
                selected.state === "UNLOCKED" ? "border-gold-600 bg-[radial-gradient(circle,var(--color-stone-700),var(--color-void))]" : "border-stone-700 bg-void",
              )}
            >
              <span className={cx(selected.state !== "UNLOCKED" && "opacity-40 brightness-0 invert-[0.25]")}>
                {selected.state === "SECRET" ? <span className="q-title text-7xl text-text-muted">?</span> : <SkillIcon icon={selected.icon} size={96} framed={false} />}
              </span>
            </div>
            <h2 id={`${ids}-detail`} className="q-title mt-4 text-2xl text-gold-300">
              {selected.title}
            </h2>
            <span
              className="mt-1 inline-block rounded-xs px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{ color: rarityColor(selected.rarity), backgroundColor: `color-mix(in oklab, ${rarityColor(selected.rarity)}, transparent 82%)` }}
            >
              {selected.state === "SECRET" ? "Secret" : RARITY_LABEL[selected.rarity]}
            </span>
            <p className="mt-3 text-text-primary">{selected.description}</p>

            {selected.state === "UNLOCKED" ? (
              <>
                <p className="mt-3 flex items-center gap-2 text-moss-300">
                  <span aria-hidden>✓</span> Collected {selected.unlockedAt && <LocalDate iso={selected.unlockedAt} />}
                </p>
                <form
                  className="mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError(null);
                    startTransition(async () => {
                      const r = await setCollectionNoteAction(selected.key, note);
                      if (r.ok) setSaved(true);
                      else setError(r.error);
                    });
                  }}
                >
                  <label htmlFor={`${ids}-note`} className="mb-1 block text-sm font-bold text-text-secondary">
                    Memory
                  </label>
                  <textarea
                    id={`${ids}-note`}
                    className={cx(field, "min-h-24")}
                    value={note}
                    maxLength={2000}
                    placeholder="What made this moment matter?"
                    onChange={(e) => {
                      setNote(e.target.value);
                      setSaved(false);
                    }}
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <GameButton type="submit" variant="secondary" size="sm" disabled={pending || note === selected.note}>
                      Save Memory
                    </GameButton>
                    {saved && <span role="status" className="text-sm text-moss-300">Saved ✓</span>}
                  </div>
                </form>
              </>
            ) : selected.state === "SECRET" ? (
              <p className="mt-3 text-sm text-text-muted">Secret items reveal themselves when obtained.</p>
            ) : selected.manual ? (
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  startTransition(async () => {
                    const r = await claimCollectionItemAction(selected.key, note);
                    if (!r.ok) setError(r.error);
                  });
                }}
              >
                <p className="text-sm text-text-secondary">This is a real-world milestone. Claim it when it happens.</p>
                <label htmlFor={`${ids}-claim-note`} className="mb-1 mt-3 block text-sm font-bold text-text-secondary">
                  Memory (optional)
                </label>
                <textarea id={`${ids}-claim-note`} className={cx(field, "min-h-20")} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
                <GameButton type="submit" variant="primary" className="mt-3 w-full" disabled={pending}>
                  Collection Item Obtained
                </GameButton>
              </form>
            ) : (
              selected.progress && (
                <div className="mt-4">
                  <p className="text-sm text-text-secondary">Unlocks automatically.</p>
                  <ProgressBar className="mt-1" tone="gold" value={selected.progress.percent} label="Unlock progress" valueText={`${selected.progress.current} of ${selected.progress.target}`} showValue />
                </div>
              )
            )}
            {error && <Notice tone="error" className="mt-3">{error}</Notice>}
          </GamePanel>
        )}
      </div>
    </div>
  );
}
