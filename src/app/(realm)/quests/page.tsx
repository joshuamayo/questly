import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/art/PageBanner";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { QuestCard } from "@/components/quests/QuestCard";
import { QuestsTabs } from "@/components/quests/QuestsTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MAIN_QUEST_CAP } from "@/game/config/balance";
import { cx } from "@/lib/cx";
import { loadQuestCounts, loadQuests, loadTemplates, type JournalView } from "@/server/queries";

export const metadata: Metadata = { title: "Quest Journal" };

const VIEWS: { key: JournalView; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "abandoned", label: "Abandoned" },
];

export default async function QuestJournalPage({ searchParams }: PageProps<"/quests">) {
  const params = await searchParams;
  const view: JournalView = VIEWS.some((v) => v.key === params.view) ? (params.view as JournalView) : "active";
  const [list, counts, templates] = await Promise.all([loadQuests(view), loadQuestCounts(), loadTemplates()]);
  const main = list.filter((q) => q.priority === "MAIN");
  const side = list.filter((q) => q.priority !== "MAIN");
  const suggestions = templates.filter((t) => !t.isCustom).slice(0, 3);

  return (
    <>
      <PageBanner slot="quests" title="Quest Journal" tagline="Take on Quests, complete objectives, and earn real rewards." />
      <QuestsTabs />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <GamePanel as="section" labelledBy="journal-heading" className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader id="journal-heading" icon={<PixelIcon name="quests" size={22} />} title="Your Quests" />
            <nav aria-label="Journal filter" className="flex gap-1.5">
              {VIEWS.map((v) => (
                <Link
                  key={v.key}
                  href={v.key === "active" ? "/quests" : `/quests?view=${v.key}`}
                  aria-current={view === v.key ? "page" : undefined}
                  className={cx(
                    "rounded-sm border px-3 py-1.5 text-sm",
                    view === v.key ? "border-blue-400 bg-blue-700/40 text-text-primary" : "border-stone-700 text-text-secondary hover:border-stone-500",
                  )}
                >
                  {v.label} ({counts[v.key]})
                </Link>
              ))}
            </nav>
          </div>

          {list.length === 0 ? (
            view === "active" ? (
              <EmptyState
                icon={<PixelIcon name="quests" size={56} />}
                title="Your Quest Journal is empty"
                message="Every adventure starts somewhere."
                action={
                  <GameLinkButton href="/quests/new" variant="primary">
                    Create Your First Quest
                  </GameLinkButton>
                }
              />
            ) : (
              <EmptyState
                icon={<PixelIcon name="quests" size={44} className="opacity-60" />}
                title={view === "completed" ? "No Quests completed yet" : "No abandoned Quests"}
                message={view === "completed" ? "Completed Quests are kept here forever." : "Abandoned Quests are kept here and can be restored."}
              />
            )
          ) : view === "active" ? (
            <div className="mt-3 flex flex-col gap-5">
              <section aria-labelledby="main-quests">
                <h3 id="main-quests" className="q-title mb-2 flex items-center gap-2 text-lg text-gold-300">
                  <PixelIcon name="total-level" size={18} /> Main Quests ({main.length}/{MAIN_QUEST_CAP})
                </h3>
                {main.length ? (
                  <ul className="flex flex-col gap-2">
                    {main.map((q) => (
                      <li key={q.id}>
                        <QuestCard quest={q} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-sm border border-dashed border-stone-600 px-3 py-3 text-sm text-text-muted">
                    No Main Quests chosen. Mark up to {MAIN_QUEST_CAP} Quests as Main to focus on what matters most.
                  </p>
                )}
              </section>
              <section aria-labelledby="side-quests">
                <h3 id="side-quests" className="q-title mb-2 flex items-center gap-2 text-lg text-gold-300">
                  <PixelIcon name="combat" size={18} /> Side Quests ({side.length})
                </h3>
                {side.length ? (
                  <ul className="flex flex-col gap-2">
                    {side.map((q) => (
                      <li key={q.id}>
                        <QuestCard quest={q} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-sm border border-dashed border-stone-600 px-3 py-3 text-sm text-text-muted">No Side Quests.</p>
                )}
              </section>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {list.map((q) => (
                <li key={q.id}>
                  <QuestCard quest={q} />
                </li>
              ))}
            </ul>
          )}
        </GamePanel>

        <div className="flex flex-col gap-4">
          <GamePanel as="section" labelledBy="journal-actions" className="p-4">
            <SectionHeader id="journal-actions" icon={<PixelIcon name="skill-creator" size={22} />} title="New Adventure" divider />
            <p className="mt-3 text-text-secondary">Write your own Quest, or pick a ready-made adventure from the Quest Board.</p>
            <div className="mt-3 flex flex-col gap-2">
              <GameLinkButton href="/quests/new" variant="primary">
                Create Quest →
              </GameLinkButton>
              <GameLinkButton href="/quests/board" variant="secondary">
                Browse the Quest Board
              </GameLinkButton>
            </div>
          </GamePanel>
          <GamePanel as="section" labelledBy="board-teaser" className="p-4">
            <SectionHeader id="board-teaser" icon={<PixelIcon name="diaries" size={22} />} title="On the Quest Board" divider />
            <ul className="mt-2">
              {suggestions.map((t) => (
                <li key={t.key}>
                  <Link
                    href={`/quests/board?template=${t.key}`}
                    className="flex items-center gap-3 border-b border-stone-800 py-2 last:border-0 hover:text-gold-200"
                  >
                    <PixelIcon name={(t.icon as never) ?? "quests"} size={24} />
                    <span className="flex-1 text-text-primary">{t.title}</span>
                    <span aria-hidden className="text-text-muted">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </GamePanel>
        </div>
      </div>
    </>
  );
}
