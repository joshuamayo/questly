import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { QuestlineBuilder } from "@/components/questlines/QuestlineBuilder";
import { loadCharacterSheet } from "@/server/queries";

export const metadata: Metadata = { title: "Chart a Questline" };

export default async function NewQuestlinePage() {
  const sheet = await loadCharacterSheet();
  return (
    <>
      <PageBanner slot="questlines" title="Chart a Questline" tagline="Turn a big goal into an adventure path." />
      <QuestlineBuilder skills={sheet.skills.map((s) => ({ key: s.key, name: s.name }))} />
    </>
  );
}
