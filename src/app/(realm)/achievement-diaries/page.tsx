import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Achievement Diaries" };

export default function Page() {
  return (
    <SystemPlaceholder
      title="Achievement Diaries"
      icon="diaries"
      tagline="Weekly & Monthly Diaries"
      description="Achievement Diaries collect broader sets of accomplishments into Easy, Medium, Hard, and Elite tiers."
      features={[
        "Track Weekly and Monthly Diaries",
        "Progress entries manually or automatically",
        "Claim tier rewards once, in order",
      ]}
    />
  );
}
