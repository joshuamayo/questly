"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { acceptTemplateAction } from "@/app/(realm)/quests/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { GameButton, GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MAIN_QUEST_CAP } from "@/game/config/balance";
import { rewardsFor } from "@/game/quests";
import { cx } from "@/lib/cx";
import type { QuestTemplateView } from "@/server/queries/quests";
import { DifficultyBadge } from "./DifficultyBadge";
import { RewardTiles } from "./RewardTiles";

const field =
  "w-full rounded-sm border border-parchment-400 bg-parchment-50/70 px-3 py-2 text-parchment-ink focus:border-gold-600 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

export function QuestBoard({
  templates,
  initialKey,
  activeMainCount,
}: {
  templates: QuestTemplateView[];
  initialKey?: string;
  activeMainCount: number;
}) {
  const router = useRouter();
  const ids = useId();
  const [selectedKey, setSelectedKey] = useState(templates.find((t) => t.key === initialKey)?.key ?? templates[0].key);
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<"MAIN" | "SIDE">("SIDE");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = templates.find((x) => x.key === selectedKey)!;
  const mainFull = activeMainCount >= MAIN_QUEST_CAP;

  function select(key: string) {
    setSelectedKey(key);
    setError(null);
    const url = new URL(window.location.href);
    url.searchParams.set("template", key);
    window.history.replaceState(null, "", url);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      document.getElementById("board-detail")?.scrollIntoView({ block: "start" });
    }
  }

  function accept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptTemplateAction(t.key, { targetDate: targetDate || null, priority });
      if (result.ok) router.push(`/quests/${result.data}?accepted=1`);
      else setError(result.error);
    });
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <GamePanel as="section" labelledBy="board-heading" className="p-4">
        <SectionHeader id="board-heading" icon={<PixelIcon name="diaries" size={22} />} title="Quest Board" divider />
        <p className="mt-3 text-text-secondary">Ready-made adventures. Accepting one adds a fresh copy to your Quest Journal.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Quest templates">
          {templates.map((tpl) => {
            const active = tpl.key === selectedKey;
            return (
              <li key={tpl.key}>
                <button
                  type="button"
                  onClick={() => select(tpl.key)}
                  aria-pressed={active}
                  aria-controls="board-detail"
                  className={cx("q-tile flex w-full items-center gap-3 p-3 text-left", active ? "border-gold-400 shadow-glow-gold" : "hover:border-stone-500")}
                >
                  <SkillIcon icon={tpl.icon} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="q-title block text-lg leading-tight text-text-primary">{tpl.title}</span>
                    {tpl.isCustom ? (
                      <span className="text-sm text-text-muted">Write your own</span>
                    ) : (
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <DifficultyBadge difficulty={tpl.difficulty!} />
                        <span className="text-sm text-text-secondary">{tpl.skillName}</span>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </GamePanel>

      <div id="board-detail" className="scroll-mt-20 xl:sticky xl:top-20">
        <GamePanel as="section" surface="parchment" labelledBy={`${ids}-title`} className="p-5">
          <div className="flex items-start gap-3">
            <SkillIcon icon={t.icon} size={48} />
            <div className="min-w-0">
              <h2 id={`${ids}-title`} className="q-title text-3xl leading-tight text-parchment-ink">
                {t.title}
              </h2>
              {!t.isCustom && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={t.difficulty!} />
                  <span className="text-sm font-bold text-parchment-ink-soft">{t.skillName}</span>
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 italic text-parchment-ink-soft">{t.description}</p>

          {t.isCustom ? (
            <div className="mt-5">
              <GameLinkButton href="/quests/new" variant="primary" className="w-full">
                Create Quest →
              </GameLinkButton>
            </div>
          ) : (
            <>
              <h3 className="q-title mt-4 text-lg text-parchment-ink">Objectives</h3>
              <ol className="mt-1 space-y-1">
                {t.objectives.map((o) => (
                  <li key={o} className="flex gap-2 text-parchment-ink">
                    <span aria-hidden className="mt-1 inline-block size-4 shrink-0 rounded-xs border-2 border-parchment-ink-soft" />
                    {o}
                  </li>
                ))}
              </ol>
              <h3 className="q-title mt-4 text-lg text-parchment-ink">Rewards</h3>
              <RewardTiles className="mt-1" tone="parchment" rewards={rewardsFor(t.difficulty!)} skillKey={t.skillKey!} skillName={t.skillName!} />

              <div className="mt-4 grid gap-3 border-t border-parchment-400/60 pt-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${ids}-target`} className="mb-1 block text-sm font-bold text-parchment-ink-soft">
                    Target date (optional)
                  </label>
                  <input id={`${ids}-target`} type="date" className={field} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                </div>
                <fieldset>
                  <legend className="mb-1 block text-sm font-bold text-parchment-ink-soft">Priority</legend>
                  <div className="flex gap-1.5">
                    {(["SIDE", "MAIN"] as const).map((p) => (
                      <label
                        key={p}
                        className={cx(
                          "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-sm border px-2 py-2 text-sm text-parchment-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring",
                          priority === p ? "border-parchment-ink bg-parchment-300/60 font-bold" : "border-parchment-400",
                          p === "MAIN" && mainFull && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          name={`${ids}-priority`}
                          checked={priority === p}
                          disabled={p === "MAIN" && mainFull}
                          onChange={() => setPriority(p)}
                        />
                        {priority === p && <span aria-hidden>✓</span>}
                        {p === "MAIN" ? "Main" : "Side"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              {mainFull && <p className="mt-1 text-xs text-parchment-ink-soft">All {MAIN_QUEST_CAP} Main Quest slots are taken.</p>}
              {error && <Notice tone="error" className="mt-3">{error}</Notice>}
              <GameButton variant="primary" size="lg" className="mt-4 w-full" disabled={pending} onClick={accept}>
                {pending ? "Accepting…" : "Accept Quest →"}
              </GameButton>
              <p className="mt-2 text-center text-xs text-parchment-ink-soft">
                You can adjust the story, dates, and objectives after accepting.{" "}
                <Link href="/quests" className="underline">
                  Back to Quest Journal
                </Link>
              </p>
            </>
          )}
        </GamePanel>
      </div>
    </div>
  );
}

