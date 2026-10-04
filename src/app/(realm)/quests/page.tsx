import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Quests" };

export default function Page() {
  return (
    <SystemPlaceholder
      slot="quests"
      title="Quests"
      icon="quests"
      tagline="Choose your next adventure."
      description="Quests are the heart of Questly: meaningful real-world goals framed as adventures, each tied to a Skill and a difficulty that determines its rewards."
      features={[
        "Create & Accept Quests with rewards derived from difficulty",
        "Follow the Current Step in your Quest Journal",
        "Complete Quests to earn XP, GP, and Quest Points exactly once",
        "Browse the Quest Board for templates and reusable adventures",
      ]}
    />
  );
}
