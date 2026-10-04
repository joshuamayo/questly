"use server";

import { runAction } from "@/server/actions/run";
import { designateBoss, clearBoss } from "@/server/bosses/service";
import type { QuestDraftInput, QuestPriority } from "@/game/quests";
import { getCharacterSheet } from "@/server/queries/character-sheet";
import * as questService from "@/server/quests/service";
import { continueQuest } from "@/server/planning/attention";
import { actionToday } from "@/server/today";

export type { ActionResult } from "@/server/actions/run";

const run = runAction;

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
    await questService.setObjectiveDone(db, c, questId, objectiveId, done, { localDate: await actionToday() });
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

export type CelebrationLevelUp = questService.QuestCompletion["levelUps"][number] & {
  skillName: string;
  skillIcon: string;
  progress: { level: number; percentToNext: number; xpRemaining: number; isMaxLevel: boolean };
};

export type CompletionPayload = Omit<questService.QuestCompletion, "levelUps"> & {
  skillName: string;
  skillIcon: string;
  levelUps: CelebrationLevelUp[];
};

export async function completeQuestAction(questId: string, localDate?: string) {
  return run<CompletionPayload>(async (db, c) => {
    const result = await questService.completeQuest(db, c, questId, { localDate: await actionToday(localDate) });
    const sheet = await getCharacterSheet(db, c);
    const skillOf = (key: string) => sheet.skills.find((s) => s.key === key)!;
    const questSkill = skillOf(result.quest.skillKey);
    return {
      ...result,
      skillName: questSkill.name,
      skillIcon: questSkill.icon,
      levelUps: result.levelUps.map((l) => {
        const s = skillOf(l.skillKey);
        return {
          ...l,
          skillName: s.name,
          skillIcon: s.icon,
          progress: {
            level: s.progress.level,
            percentToNext: s.progress.percentToNext,
            xpRemaining: s.progress.xpRemaining,
            isMaxLevel: s.progress.isMaxLevel,
          },
        };
      }),
    };
  });
}

export async function bossAction(questId: string, action: "designate" | "clear") {
  return run(async (db, c) => {
    if (action === "designate") await designateBoss(db, c, questId);
    else await clearBoss(db, c, questId);
  });
}

export async function continueQuestAction(
  questId: string,
  input: { targetDate: string; deadline?: string | null },
  reason: "CONTINUE" | "RESCOPE" | "RESPAWN" = "CONTINUE",
  localDate?: string,
) {
  return run(async (db, c) => continueQuest(db, c, questId, input, await actionToday(localDate), reason));
}
