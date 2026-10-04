import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/art/PageBanner";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { QuestlineView } from "@/components/questlines/QuestlineView";
import { skillColor } from "@/components/skills/skill-style";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cx } from "@/lib/cx";
import { loadCharacterSheet, loadQuestlineDetail, loadQuestlines } from "@/server/queries";

export const metadata: Metadata = { title: "Questlines" };

export default async function QuestlinesPage({ searchParams }: PageProps<"/questlines">) {
  const [params, lines, sheet] = await Promise.all([searchParams, loadQuestlines(), loadCharacterSheet()]);
  const requested = typeof params.id === "string" ? params.id : null;
  const selectedId = lines.find((l) => l.id === requested)?.id ?? lines.find((l) => l.status === "ACTIVE")?.id ?? lines[0]?.id ?? null;
  const detail = selectedId ? await loadQuestlineDetail(selectedId) : null;
  const skillNames = Object.fromEntries(sheet.skills.map((s) => [s.key, s.name]));

  return (
    <>
      <PageBanner slot="questlines" title="Questlines" tagline="Bigger journeys. Greater rewards." />
      {lines.length === 0 ? (
        <GamePanel className="p-6">
          <EmptyState
            icon={<PixelIcon name="questlines" size={56} />}
            title="No Questlines charted yet"
            message="A Questline turns a big goal into an adventure path: linked Quests that unlock one another, with a bonus for finishing the whole journey."
            action={
              <GameLinkButton href="/questlines/new" variant="primary">
                Chart a Questline →
              </GameLinkButton>
            }
          />
        </GamePanel>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <GamePanel as="nav" aria-label="Questlines" className="p-3">
            <SectionHeader icon={<PixelIcon name="questlines" size={20} />} title="Your Questlines" level={3} divider />
            <ul className="mt-2 flex flex-col gap-2">
              {lines.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/questlines?id=${l.id}`}
                    aria-current={l.id === selectedId ? "page" : undefined}
                    className={cx("q-tile flex items-center gap-3 p-2.5", l.id === selectedId ? "border-gold-400 shadow-glow-gold" : "hover:border-stone-500")}
                  >
                    <SkillIcon icon={`skill-${l.skillKey}`} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="q-title block truncate text-lg leading-tight text-text-primary">{l.title}</span>
                      <span className="flex items-center gap-2">
                        <ProgressBar size="sm" className="flex-1" color={skillColor(l.skillKey)} value={l.percent} label={`${l.title} progress`} valueText={`${l.completed} of ${l.total}`} />
                        <span className="text-xs tabular-nums text-text-muted">
                          {l.completed}/{l.total}
                        </span>
                      </span>
                      {l.status !== "ACTIVE" && <span className="text-xs text-moss-300">{l.status === "COMPLETED" ? "✓ Complete" : "Archived"}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <GameLinkButton href="/questlines/new" variant="secondary" size="sm" className="mt-3 w-full">
              + Chart a Questline
            </GameLinkButton>
          </GamePanel>
          {detail && <QuestlineView key={detail.id} line={detail} skillNames={skillNames} />}
        </div>
      )}
    </>
  );
}
