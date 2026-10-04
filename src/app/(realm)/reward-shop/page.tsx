import type { Metadata } from "next";
import { SystemPlaceholder } from "@/components/system/SystemPlaceholder";

export const metadata: Metadata = { title: "Reward Shop" };

export default function Page() {
  return (
    <SystemPlaceholder
      title="Reward Shop"
      icon="shop"
      tagline="Spend What You Earned"
      description="The Reward Shop holds real-life rewards you define for yourself and redeem with GP earned from Quests."
      features={[
        "Create rewards worth fighting for",
        "Redeem them with GP — never below zero",
        "Keep a permanent redemption history",
      ]}
    />
  );
}
