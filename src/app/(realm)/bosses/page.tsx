import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Bosses" };

export default function Page() {
  return (
    <SystemPlaceholder
      slot="bosses"
      title="Bosses"
      icon="bosses"
      tagline="Take on your biggest challenges."
      description="Bosses represent your biggest current challenges. One Current Boss is emphasized at a time, and its HP falls as you make progress."
      features={[
        "Designate a major Quest as your Current Boss",
        "Watch Boss HP fall with each objective",
        "Claim a bounty for defeating it on time",
      ]}
    />
  );
}
