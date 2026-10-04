"use server";

import type { RewardInput } from "@/game/rewards";
import { runAction } from "@/server/actions/run";
import { addRewardFromTemplate, createReward, redeemReward, removeReward, setRewardActive, updateReward } from "@/server/rewards/service";

export async function createRewardAction(input: RewardInput) {
  return runAction(async (db, c) => (await createReward(db, c, input)).id);
}

export async function addRewardTemplateAction(key: string) {
  return runAction(async (db, c) => (await addRewardFromTemplate(db, c, key)).id);
}

export async function updateRewardAction(rewardId: string, input: RewardInput) {
  return runAction(async (db, c) => {
    await updateReward(db, c, rewardId, input);
  });
}

export async function setRewardActiveAction(rewardId: string, active: boolean) {
  return runAction((db, c) => setRewardActive(db, c, rewardId, active));
}

export async function removeRewardAction(rewardId: string) {
  return runAction((db, c) => removeReward(db, c, rewardId));
}

export async function redeemRewardAction(rewardId: string, requestId: string) {
  return runAction((db, c) => redeemReward(db, c, rewardId, requestId));
}
