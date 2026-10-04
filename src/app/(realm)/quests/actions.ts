"use server";

import { revalidatePath } from "next/cache";
import { GameRuleError } from "@/game/errors";
import type { QuestDraftInput, QuestPriority } from "@/game/quests";
import { getDb } from "@/server/db/client";
import { resolveCurrentCharacterId, getCharacterSheet } from "@/server/queries/character-sheet";
import * as questService from "@/server/quests/service";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Runs a Quest mutation for the current character. Rule violations return
 * their player-facing message; unexpected failures say plainly that nothing
 * changed (the service runs in a transaction, so that is true).
 */
async function run<T>(fn: (db: Awaited<ReturnType<typeof getDb>>, characterId: string) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const db = await getDb();
    const characterId = await resolveCurrentCharacterId(db);
    const data = await fn(db, characterId);
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof GameRuleError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Something went wrong. Your progress was not changed. Try again." };
  }
}

export async function createQuestAction(input: QuestDraftInput) {
  return run(async (db, c) => (await questService.createQuest(db, c, input)).id);
}

export async function acceptTemplateAction(
  templateKey: string,
  options: { targetDate?: string | null; deadline?: string | null; priority?: QuestPriority },
) {
  return run(async (db, c) => (await questService.acceptTemplate(db, c, templateKey, options)).id);
}

export async function setObjectiveDoneAction(questId: string, objectiveId: string, done: boolean) {
  return run(async (db, c) => {
    await questService.setObjectiveDone(db, c, questId, objectiveId, done);
  });
}

export async function addObjectiveAction(questId: string, title: string) {
  return run(async (db, c) => {
    await questService.addObjective(db, c, questId, title);
  });
}

export async function removeObjectiveAction(questId: string, objectiveId: string) {
  return run((db, c) => questService.removeObjective(db, c, questId, objectiveId));
}

export async function moveObjectiveAction(questId: string, objectiveId: string, direction: "up" | "down") {
  return run((db, c) => questService.moveObjective(db, c, questId, objectiveId, direction));
}

export async function updateQuestDetailsAction(questId: string, input: questService.QuestDetailsInput) {
  return run(async (db, c) => {
    await questService.updateQuestDetails(db, c, questId, input);
  });
}

export async function setQuestPriorityAction(questId: string, priority: QuestPriority) {
  return run((db, c) => questService.setQuestPriority(db, c, questId, priority));
}

export async function questStatusAction(questId: string, action: "hold" | "resume" | "abandon" | "restore") {
  const fn = {
    hold: questService.holdQuest,
    resume: questService.resumeQuest,
    abandon: questService.abandonQuest,
    restore: questService.restoreQuest,
  }[action];
  return run((db, c) => fn(db, c, questId));
}

export type CompletionPayload = questService.QuestCompletion & {
  skillName: string;
  skillIcon: string;
  /** Skill progress after the reward, for the Level Up card. */
  skillProgress: { level: number; percentToNext: number; xpRemaining: number; isMaxLevel: boolean };
};

export async function completeQuestAction(questId: string) {
  return run<CompletionPayload>(async (db, c) => {
    const result = await questService.completeQuest(db, c, questId);
    const sheet = await getCharacterSheet(db, c);
    const skill = sheet.skills.find((s) => s.key === result.quest.skillKey)!;
    return {
      ...result,
      skillName: skill.name,
      skillIcon: skill.icon,
      skillProgress: {
        level: skill.progress.level,
        percentToNext: skill.progress.percentToNext,
        xpRemaining: skill.progress.xpRemaining,
        isMaxLevel: skill.progress.isMaxLevel,
      },
    };
  });
}
