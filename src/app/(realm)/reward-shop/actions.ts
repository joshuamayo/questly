"use server";

import type { RewardInput } from "@/game/rewards";
import { runAction } from "@/server/actions/run";
import { addSuggestedRewards, createReward, redeemReward, setFeaturedGoal, setRewardActive, updateReward } from "@/server/rewards/service";

export async function createRewardAction(input: RewardInput) {
  return runAction(async (db, c) => (await createReward(db, c, input)).id);
}

export async function addSuggestedRewardsAction() {
  return runAction((db, c) => addSuggestedRewards(db, c));
}

export async function updateRewardAction(rewardId: string, input: RewardInput) {
  return runAction(async (db, c) => {
    await updateReward(db, c, rewardId, input);
  });
}

export async function setRewardActiveAction(rewardId: string, active: boolean) {
  return runAction((db, c) => setRewardActive(db, c, rewardId, active));
}

export async function setFeaturedGoalAction(rewardId: string | null) {
  return runAction((db, c) => setFeaturedGoal(db, c, rewardId));
}

export async function redeemRewardAction(rewardId: string, requestId: string) {
  return runAction((db, c) => redeemReward(db, c, rewardId, requestId));
}
