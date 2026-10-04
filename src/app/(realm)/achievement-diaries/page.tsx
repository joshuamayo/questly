import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Achievement Diaries" };

export default function Page() {
  return (
    <SystemPlaceholder
      slot="achievement-diaries"
      title="Achievement Diaries"
      icon="diaries"
      tagline="Complete diaries and track your long-term progress."
      description="Achievement Diaries collect broader sets of accomplishments into Easy, Medium, Hard, and Elite tiers."
      features={[
        "Track Weekly and Monthly Diaries",
        "Progress entries manually or automatically",
        "Claim tier rewards once, in order",
      ]}
    />
  );
}
