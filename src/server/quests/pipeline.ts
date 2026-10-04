/**
 * QUEST_COMPLETED pipeline (CLAUDE.md §23). Runs inside the completion
 * transaction after the Quest's own rewards: Boss bounty, newly available
 * Quests, and Questline completion. Each step is idempotent.
 */

import { and, eq } from "drizzle-orm";
import { bountyFor, type BountySnapshot, type BountyTier } from "@/game/bosses";
import { questlineBonus } from "@/game/questlines";
import type { RequirementContext } from "@/game/requirements";
import type { SkillKey } from "@/game/vocabulary";
import type { Db } from "../db/client";
import { activityEvents, questlines, quests, type QuestRow } from "../db/schema";
import { recordProgression } from "../progression/service";
import { buildRequirementContext, lockStates } from "../requirements/service";

export type LevelUpInfo = { skillKey: SkillKey; fromLevel: number; toLevel: number; levelsReached: number[] };

export type PipelineResult = {
  boss: { tier: BountyTier; bountyGp: number } | null;
  unlocked: { id: string; title: string }[];
  questline: { id: string; title: string; bonusXp: number; bonusGp: number; skillKey: SkillKey } | null;
  levelUps: LevelUpInfo[];
};

export async function onQuestCompleted(
  tx: Db,
  characterId: string,
  quest: QuestRow,
  today: string,
  ctxBefore: RequirementContext,
): Promise<PipelineResult> {
  const result: PipelineResult = { boss: null, unlocked: [], questline: null, levelUps: [] };

  // 1. Boss bounty — bonus GP only, never deducts, never replaces Quest rewards.
  if (quest.isBoss) {
    const { tier, gp } = bountyFor(quest.bounty as BountySnapshot | null, quest.targetDate, quest.deadline, today);
    if (gp > 0) {
      await recordProgression(tx, characterId, {
        kind: "GP",
        amount: gp,
        sourceType: "BOSS",
        sourceId: quest.id,
        idempotencyKey: `quest:${quest.id}:bounty`,
        metadata: { questTitle: quest.title, tier },
      });
    }
    await tx.insert(activityEvents).values({
      characterId,
      type: "BOSS_DEFEATED",
      entityId: quest.id,
      payload: { title: quest.title, tier, bountyGp: gp },
    });
    result.boss = { tier, bountyGp: gp };
  }

  // 2. Questline completion bonus (once).
  if (quest.questlineId) {
    const [line] = await tx.select().from(questlines).where(eq(questlines.id, quest.questlineId)).for("update");
    const members = await tx.select().from(quests).where(eq(quests.questlineId, quest.questlineId));
    if (line && line.status === "ACTIVE" && members.every((m) => m.status === "COMPLETED")) {
      const bonus = questlineBonus(members.map((m) => ({ xp: m.rewardXp, gp: m.rewardGp })));
      const source = { sourceType: "QUESTLINE" as const, sourceId: line.id, metadata: { questlineTitle: line.title } };
      if (bonus.xp > 0) {
        const r = await recordProgression(tx, characterId, {
          kind: "XP",
          skillKey: line.skillKey as SkillKey,
          amount: bonus.xp,
          ...source,
          idempotencyKey: `questline:${line.id}:xp`,
        });
        if (r.xp?.leveledUp) {
          result.levelUps.push({ skillKey: line.skillKey as SkillKey, fromLevel: r.xp.previousLevel, toLevel: r.xp.newLevel, levelsReached: r.xp.levelsReached });
        }
      }
      if (bonus.gp > 0) {
        await recordProgression(tx, characterId, { kind: "GP", amount: bonus.gp, ...source, idempotencyKey: `questline:${line.id}:gp` });
      }
      await tx.update(questlines).set({ status: "COMPLETED", completedAt: new Date() }).where(eq(questlines.id, line.id));
      await tx.insert(activityEvents).values({
        characterId,
        type: "QUESTLINE_COMPLETED",
        entityId: line.id,
        payload: { title: line.title, bonusXp: bonus.xp, bonusGp: bonus.gp },
      });
      result.questline = { id: line.id, title: line.title, bonusXp: bonus.xp, bonusGp: bonus.gp, skillKey: line.skillKey as SkillKey };
    }
  }

  // 3. New Quests available: anything that was locked before and is unlocked now.
  const available = await tx
    .select({ id: quests.id, title: quests.title })
    .from(quests)
    .where(and(eq(quests.characterId, characterId), eq(quests.status, "AVAILABLE")));
  if (available.length) {
    const ids = available.map((a) => a.id);
    const ctxAfter = await buildRequirementContext(tx, characterId, today);
    const [before, after] = await Promise.all([lockStates(tx, characterId, ids, ctxBefore), lockStates(tx, characterId, ids, ctxAfter)]);
    for (const a of available) {
      if (before.get(a.id)?.locked && !after.get(a.id)?.locked) {
        result.unlocked.push(a);
        await tx.insert(activityEvents).values({ characterId, type: "NEW_QUEST_AVAILABLE", entityId: a.id, payload: { title: a.title } });
      }
    }
  }
  return result;
}
