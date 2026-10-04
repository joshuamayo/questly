import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Collection Log" };

export default function Page() {
  return (
    <SystemPlaceholder
      title="Collection Log"
      icon="collection"
      tagline="A Museum of Accomplishments"
      description="The Collection Log is a permanent museum of meaningful accomplishments — a grid of collectible slots, some hidden until discovered."
      features={[
        "Fill collectible slots across six categories",
        "Discover secret ??? items",
        "Attach memories to unlocked items",
      ]}
    />
  );
}
