import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Bosses" };

export default function Page() {
  return (
    <SystemPlaceholder
      title="Bosses"
      icon="bosses"
      tagline="Your Greatest Challenges"
      description="Bosses represent your biggest current challenges. One Current Boss is emphasized at a time, and its HP falls as you make progress."
      features={[
        "Designate a major Quest as your Current Boss",
        "Watch Boss HP fall with each objective",
        "Claim a bounty for defeating it on time",
      ]}
    />
  );
}
