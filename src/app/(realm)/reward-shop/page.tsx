import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { RewardShop } from "@/components/rewards/RewardShop";
import { loadRewardShop } from "@/server/queries";

export const metadata: Metadata = { title: "Reward Shop" };

export default async function RewardShopPage() {
  const shop = await loadRewardShop();
  return (
    <>
      <PageBanner slot="reward-shop" title="Reward Shop" tagline="Turn your progress into real rewards." />
      <RewardShop
        balance={shop.balance}
        rewards={shop.rewards.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          category: r.category,
          icon: r.icon,
          gpCost: r.gpCost,
          repeatable: r.repeatable,
          active: r.active,
          estimatedValue: r.estimatedValue,
          timesRedeemed: r.timesRedeemed,
        }))}
        history={shop.history.map((h) => ({ id: h.id, name: h.rewardNameSnapshot, gpCost: h.gpCostSnapshot, redeemedAt: h.redeemedAt.toISOString() }))}
        templates={[...shop.templates]}
      />
    </>
  );
}
