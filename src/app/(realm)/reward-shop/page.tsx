import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { RewardShop } from "@/components/rewards/RewardShop";
import { formatNumber } from "@/lib/format";
import { loadProfile, loadRewardShop } from "@/server/loaders";

export const metadata: Metadata = { title: "Reward Shop" };

export default async function RewardShopPage() {
  const [profile, shop] = await Promise.all([loadProfile(), loadRewardShop()]);
  return (
    <>
      <PageBanner slot="reward-shop" title="Reward Shop" tagline="Spend your hard-earned GP on real rewards.">
        <p className="q-stone q-frame-gold mt-4 inline-flex items-center gap-3 px-4 py-2">
          <PixelIcon name="gp" size={36} />
          <span>
            <span className="block text-xs font-bold uppercase tracking-wider text-text-muted">Your GP</span>
            <span className="q-title text-2xl tabular-nums text-gold-200">{formatNumber(shop.gpBalance)} GP</span>
          </span>
        </p>
      </PageBanner>
      <RewardShop
        gpBalance={shop.gpBalance}
        celebrate={profile.settings.celebrateRedemptions}
        sound={profile.settings.sound}
        rewards={shop.rewards.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          icon: r.icon,
          gpCost: r.gpCost,
          repeatable: r.repeatable,
          active: r.active,
          featuredGoal: r.featuredGoal,
          timesRedeemed: r.timesRedeemed,
        }))}
        history={shop.history.map((h) => ({ id: h.id, name: h.rewardNameSnapshot, gpCost: h.gpCostSnapshot, redeemedAt: h.redeemedAt.toISOString() }))}
      />
    </>
  );
}
