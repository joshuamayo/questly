import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Combat Achievements" };

export default function Page() {
  return (
    <SystemPlaceholder
      slot="combat-achievements"
      title="Combat Achievements"
      icon="combat"
      tagline="Push your limits and prove your consistency."
      description="Combat Achievements measure how well you execute — deep work, deadlines met, Bosses defeated — and award permanent Combat Points."
      features={[
        "Pursue challenges from Easy to Grandmaster",
        "Have progress tracked automatically",
        "Earn permanent Combat Points and tier rewards",
      ]}
    />
  );
}
