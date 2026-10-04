/**
 * Reward Shop. Rewards are the player's own real-life rewards, bought with
 * earned GP only. Redemption is atomic: validate → deduct GP (guarded, never
 * negative) → ledger transaction → redemption record → retire one-time
 * rewards. A client request id makes a double-submitted redemption a no-op.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { GameRuleError } from "@/game/errors";
import { REWARD_SUGGESTIONS, validateReward, type RewardInput } from "@/game/rewards";
import type { Db } from "../db/client";
import { characters, gpTransactions, rewardRedemptions, rewards, type RewardRow } from "../db/schema";
import { spendGp } from "../gp/service";

export class RewardNotFoundError extends GameRuleError {
  constructor() {
    super("That reward could not be found.", "REWARD_NOT_FOUND");
  }
}

async function ownReward(db: Db, characterId: string, rewardId: string, lock = false): Promise<RewardRow> {
  const q = db.select().from(rewards).where(and(eq(rewards.id, rewardId), eq(rewards.characterId, characterId)));
  const [row] = lock ? await q.for("update") : await q;
  if (!row) throw new RewardNotFoundError();
  return row;
}

export async function createReward(db: Db, characterId: string, input: RewardInput) {
  const clean = validateReward(input);
  const [count] = await db.select({ n: sql<number>`count(*)::int` }).from(rewards).where(eq(rewards.characterId, characterId));
  if (count.n >= 200) throw new GameRuleError("Your Reward Shop is full. Archive a reward first.", "REWARD_LIMIT");
  const [row] = await db.insert(rewards).values({ characterId, ...clean }).returning();
  return row;
}

/** Fill an empty shop with the starter ideas (spec §17). */
export async function addSuggestedRewards(db: Db, characterId: string) {
  return db.transaction(async (tx) => {
    const [count] = await tx.select({ n: sql<number>`count(*)::int` }).from(rewards).where(eq(rewards.characterId, characterId));
    if (count.n > 0) throw new GameRuleError("Starter rewards can only be added to an empty Reward Shop.", "SHOP_NOT_EMPTY");
    await tx.insert(rewards).values(REWARD_SUGGESTIONS.map((r) => ({ characterId, ...r, description: "" })));
  });
}

/** Editing never changes past redemptions (they snapshot name and cost). */
export async function updateReward(db: Db, characterId: string, rewardId: string, input: RewardInput) {
  const clean = validateReward(input);
  await ownReward(db, characterId, rewardId);
  const [row] = await db.update(rewards).set(clean).where(eq(rewards.id, rewardId)).returning();
  return row;
}

/** Archive (hide) or restore a reward. Archiving also clears it as the savings goal. */
export async function setRewardActive(db: Db, characterId: string, rewardId: string, active: boolean) {
  const reward = await ownReward(db, characterId, rewardId);
  if (active && !reward.repeatable) {
    const [used] = await db.select({ id: rewardRedemptions.id }).from(rewardRedemptions).where(eq(rewardRedemptions.rewardId, rewardId)).limit(1);
    if (used) throw new GameRuleError("This one-time reward has already been claimed.", "REWARD_ALREADY_CLAIMED");
  }
  await db.update(rewards).set(active ? { active } : { active, featuredGoal: false }).where(eq(rewards.id, rewardId));
}

/** Make one reward the "Saving for" goal (or clear it with null). */
export async function setFeaturedGoal(db: Db, characterId: string, rewardId: string | null) {
  return db.transaction(async (tx) => {
    if (rewardId) {
      const reward = await ownReward(tx, characterId, rewardId);
      if (!reward.active) throw new GameRuleError("Archived rewards can't be a savings goal.", "REWARD_ARCHIVED");
    }
    await tx.update(rewards).set({ featuredGoal: false }).where(and(eq(rewards.characterId, characterId), eq(rewards.featuredGoal, true)));
    if (rewardId) await tx.update(rewards).set({ featuredGoal: true }).where(eq(rewards.id, rewardId));
  });
}

export type Redemption = { duplicate: boolean; redemptionId: string; rewardName: string; gpCost: number; gpBalance: number };

/**
 * Redeem a reward. `requestId` (generated per confirmation) makes retries
 * and double clicks safe: the same request never spends twice.
 */
export async function redeemReward(db: Db, characterId: string, rewardId: string, requestId: string): Promise<Redemption> {
  if (!/^[A-Za-z0-9-]{8,64}$/.test(requestId)) throw new GameRuleError("The redemption request was malformed. Try again.", "BAD_REQUEST_ID");
  return db.transaction(async (tx) => {
    const key = `redeem:${requestId}`;
    const [prior] = await tx
      .select()
      .from(gpTransactions)
      .where(and(eq(gpTransactions.characterId, characterId), eq(gpTransactions.idempotencyKey, key)));
    if (prior) {
      const [c] = await tx.select({ gp: characters.gpBalance }).from(characters).where(eq(characters.id, characterId));
      const [r] = await tx.select().from(rewardRedemptions).where(eq(rewardRedemptions.id, prior.sourceId!));
      return { duplicate: true, redemptionId: prior.sourceId!, rewardName: r?.rewardNameSnapshot ?? prior.description, gpCost: -prior.amount, gpBalance: c.gp };
    }

    // 1. Validate.
    const reward = await ownReward(tx, characterId, rewardId, true);
    if (!reward.active) throw new GameRuleError("This reward is archived. Restore it to redeem it.", "REWARD_ARCHIVED");
    if (!reward.repeatable) {
      const [used] = await tx.select({ id: rewardRedemptions.id }).from(rewardRedemptions).where(eq(rewardRedemptions.rewardId, rewardId)).limit(1);
      if (used) throw new GameRuleError("This one-time reward has already been claimed.", "REWARD_ALREADY_CLAIMED");
    }
    // 2–5. Redemption record + guarded GP deduction with its ledger entry (rolls back together).
    const [redemption] = await tx
      .insert(rewardRedemptions)
      .values({ rewardId, characterId, gpCostSnapshot: reward.gpCost, rewardNameSnapshot: reward.name })
      .returning();
    const { gpBalance } = await spendGp(tx, characterId, reward.gpCost, {
      sourceType: "REWARD",
      sourceId: redemption.id,
      description: reward.name,
      idempotencyKey: key,
    });
    // 6. One-time rewards retire after use.
    if (!reward.repeatable) await tx.update(rewards).set({ active: false, featuredGoal: false }).where(eq(rewards.id, rewardId));
    return { duplicate: false, redemptionId: redemption.id, rewardName: reward.name, gpCost: reward.gpCost, gpBalance };
  });
}

export async function getRewardShop(db: Db, characterId: string) {
  const [list, history, counts, [c]] = await Promise.all([
    db.select().from(rewards).where(eq(rewards.characterId, characterId)).orderBy(rewards.gpCost, rewards.createdAt),
    db.select().from(rewardRedemptions).where(eq(rewardRedemptions.characterId, characterId)).orderBy(desc(rewardRedemptions.redeemedAt)).limit(100),
    db
      .select({ rewardId: rewardRedemptions.rewardId, n: sql<number>`count(*)::int` })
      .from(rewardRedemptions)
      .where(eq(rewardRedemptions.characterId, characterId))
      .groupBy(rewardRedemptions.rewardId),
    db.select({ gpBalance: characters.gpBalance }).from(characters).where(eq(characters.id, characterId)),
  ]);
  const times = new Map(counts.map((r) => [r.rewardId, r.n]));
  return {
    gpBalance: c.gpBalance,
    rewards: list.map((r) => ({ ...r, timesRedeemed: times.get(r.id) ?? 0 })),
    history,
  };
}
