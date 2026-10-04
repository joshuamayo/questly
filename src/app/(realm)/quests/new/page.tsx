import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { CreateQuestForm } from "@/components/quests/CreateQuestForm";
import { QuestsTabs } from "@/components/quests/QuestsTabs";
import { loadBalanceView, loadCharacterSheet, loadQuests } from "@/server/queries";

export const metadata: Metadata = { title: "Create Quest" };

export default async function CreateQuestPage({ searchParams }: PageProps<"/quests/new">) {
  const [sheet, active, params] = await Promise.all([loadCharacterSheet(), loadQuests("active"), searchParams]);
  const preferred = typeof params.skill === "string" ? params.skill : null;
  const skills = sheet.skills.map((s) => ({ key: s.key, name: s.name, icon: s.icon, motto: s.motto }));
  return (
    <>
      <PageBanner slot="quests" title="Create Quest" tagline="Turn a real-life goal into an adventure." />
      <QuestsTabs />
      <CreateQuestForm skills={skills} initialSkill={skills.find((s) => s.key === preferred)?.key} activeMainCount={active.filter((q) => q.priority === "MAIN").length}
        mainQuestCap={(await loadBalanceView()).mainQuestCap} />
    </>
  );
}
