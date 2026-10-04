import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { QuestBoard } from "@/components/quests/QuestBoard";
import { QuestsTabs } from "@/components/quests/QuestsTabs";
import { loadBalanceView, loadQuests, loadTemplates } from "@/server/queries";

export const metadata: Metadata = { title: "Quest Board" };

export default async function QuestBoardPage({ searchParams }: PageProps<"/quests/board">) {
  const [templates, active, params] = await Promise.all([loadTemplates(), loadQuests("active"), searchParams]);
  const initialKey = typeof params.template === "string" ? params.template : undefined;
  return (
    <>
      <PageBanner slot="quests" title="Quest Board" tagline="Choose your next adventure." />
      <QuestsTabs />
      <QuestBoard
        key={initialKey ?? "board"}
        templates={templates}
        initialKey={initialKey}
        activeMainCount={active.filter((q) => q.priority === "MAIN").length}
        mainQuestCap={(await loadBalanceView()).mainQuestCap}
      />
    </>
  );
}
