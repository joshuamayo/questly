import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <SystemPlaceholder
      title="Settings"
      icon="settings"
      tagline="Game Rules & Preferences"
      description="Settings will hold your profile, schedule, Focus, notification, appearance, and advanced Game Balance preferences."
      features={[
        "Edit your display name, avatar, title, and cape",
        "Set workdays, week start, and vacation mode",
        "Adjust Focus defaults and reduced motion",
        "Review Game Balance (advanced)",
      ]}
    />
  );
}
