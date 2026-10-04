import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActiveQuest } from "@/components/quests/ActiveQuest";
import { QuestsTabs } from "@/components/quests/QuestsTabs";
import { loadBalanceView, loadQuestDetail, loadQuests, loadToday } from "@/server/queries";
import { QuestNotFoundError } from "@/server/quests/service";

export const metadata: Metadata = { title: "Active Quest" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ActiveQuestPage({ params, searchParams }: PageProps<"/quests/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();
  let quest;
  try {
    quest = await loadQuestDetail(id);
  } catch (error) {
    if (error instanceof QuestNotFoundError) notFound();
    throw error;
  }
  const active = await loadQuests("active");
  return (
    <div className="pt-4 lg:pt-20">
      <QuestsTabs />
      <ActiveQuest
        key={quest.id}
        quest={quest}
        justAccepted={query.accepted === "1"}
        rescope={query.rescope === "1"}
        today={await loadToday()}
        activeMainCount={active.filter((q) => q.priority === "MAIN").length}
        mainQuestCap={(await loadBalanceView()).mainQuestCap}
      />
    </div>
  );
}
