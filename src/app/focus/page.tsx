import type { Metadata } from "next";
import { FocusEncounter } from "@/components/focus/FocusEncounter";
import { FOCUS_XP } from "@/game/config/balance";
import { loadActiveFocusSession, loadFocusStats, loadQuestDetail, loadQuests, type QuestDetail } from "@/server/queries";
import { QuestNotFoundError } from "@/server/quests/service";

export const metadata: Metadata = { title: "Focus Mode" };

export default async function FocusPage({ searchParams }: PageProps<"/focus">) {
  const [params, session, stats, active] = await Promise.all([searchParams, loadActiveFocusSession(), loadFocusStats(), loadQuests("active")]);
  const questId = session?.questId ?? (typeof params.quest === "string" ? params.quest : null) ?? active.find((q) => q.status !== "ON_HOLD")?.id ?? null;
  let quest: QuestDetail | null = null;
  if (questId) {
    try {
      quest = await loadQuestDetail(questId);
    } catch (error) {
      if (!(error instanceof QuestNotFoundError)) throw error;
    }
  }
  return (
    <FocusEncounter
      key={`${session?.id ?? "idle"}-${quest?.id ?? "free"}`}
      quest={quest}
      session={session ? { id: session.id, startedAt: session.startedAt.toISOString(), plannedMinutes: session.plannedMinutes } : null}
      stats={stats.last24h}
      config={{ presets: [...FOCUS_XP.timerPresetsMinutes], cap: FOCUS_XP.dailyXpCap, tiers: FOCUS_XP.sessionTiers.map((t) => ({ ...t })) }}
    />
  );
}
