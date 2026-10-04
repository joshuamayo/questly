import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Questlines" };

export default function Page() {
  return (
    <SystemPlaceholder
      slot="questlines"
      title="Questlines"
      icon="questlines"
      tagline="Bigger journeys. Greater rewards."
      description="Questlines turn larger projects into branching adventure paths, where completing one Quest unlocks the next."
      features={[
        "Chart ordered and branching Quest dependencies",
        "Inspect requirements on locked Quests",
        "Earn a Questline reward and trophy on completion",
      ]}
    />
  );
}
