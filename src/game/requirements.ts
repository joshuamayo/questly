/**
 * Requirements engine (CLAUDE.md §24). One evaluator for every requirement
 * type; the UI receives description, current value, required value, and met.
 */

import { GameRuleError } from "./errors";


export const REQUIREMENT_TYPES = [
  "QUEST_COMPLETED",
  "QUESTLINE_COMPLETED",
  "SKILL_LEVEL",
  "QUEST_POINTS",
  "COMBAT_POINTS",
  "COLLECTION_ITEM",
  "DATE_REACHED",
  "MANUAL",
] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export type Requirement = {
  id: string;
  type: RequirementType;
  reference: string | null;
  requiredValue: number | null;
  label: string | null;
  manualMet: boolean;
};

export type RequirementContext = {
  skillLevels: Record<string, number>;
  skillNames: Record<string, string>;
  questPoints: number;
  combatPoints: number;
  completedQuestIds: ReadonlySet<string>;
  questTitles: Record<string, string>;
  completedQuestlineIds: ReadonlySet<string>;
  questlineTitles: Record<string, string>;
  collectionItemKeys: ReadonlySet<string>;
  collectionItemTitles: Record<string, string>;
  /** Viewer's local date, YYYY-MM-DD. */
  today: string;
};

export type RequirementStatus = {
  id: string;
  type: RequirementType;
  description: string;
  current: string;
  required: string;
  met: boolean;
};

export function evaluateRequirement(req: Requirement, ctx: RequirementContext): RequirementStatus {
  const base = { id: req.id, type: req.type };
  const need = req.requiredValue ?? 0;
  switch (req.type) {
    case "QUEST_COMPLETED": {
      const done = req.reference ? ctx.completedQuestIds.has(req.reference) : false;
      const title = (req.reference && ctx.questTitles[req.reference]) || "a Quest";
      return { ...base, description: `Complete “${title}”`, current: done ? "Complete" : "Not complete", required: "Complete", met: done };
    }
    case "QUESTLINE_COMPLETED": {
      const done = req.reference ? ctx.completedQuestlineIds.has(req.reference) : false;
      const title = (req.reference && ctx.questlineTitles[req.reference]) || "a Questline";
      return { ...base, description: `Complete the ${title} Questline`, current: done ? "Complete" : "Not complete", required: "Complete", met: done };
    }
    case "SKILL_LEVEL": {
      const level = (req.reference && ctx.skillLevels[req.reference]) || 1;
      const name = (req.reference && ctx.skillNames[req.reference]) || "Skill";
      return { ...base, description: `${name} Level ${need}`, current: `Level ${level}`, required: `Level ${need}`, met: level >= need };
    }
    case "QUEST_POINTS":
      return { ...base, description: `${need} Quest Points`, current: `${ctx.questPoints} QP`, required: `${need} QP`, met: ctx.questPoints >= need };
    case "COMBAT_POINTS":
      return {
        ...base,
        description: `${need} Combat Points`,
        current: `${ctx.combatPoints} CP`,
        required: `${need} CP`,
        met: ctx.combatPoints >= need,
      };
    case "COLLECTION_ITEM": {
      const has = req.reference ? ctx.collectionItemKeys.has(req.reference) : false;
      const title = (req.reference && ctx.collectionItemTitles[req.reference]) || "a Collection item";
      return { ...base, description: `Obtain ${title}`, current: has ? "Obtained" : "Not obtained", required: "Obtained", met: has };
    }
    case "DATE_REACHED": {
      const date = req.reference ?? "";
      const met = Boolean(date) && ctx.today >= date;
      return { ...base, description: `On or after ${date}`, current: ctx.today, required: date, met };
    }
    case "MANUAL":
      return {
        ...base,
        description: req.label || "Manual requirement",
        current: req.manualMet ? "Met" : "Not met",
        required: "Met",
        met: req.manualMet,
      };
  }
}

export function evaluateRequirements(reqs: readonly Requirement[], ctx: RequirementContext) {
  const statuses = reqs.map((r) => evaluateRequirement(r, ctx));
  return { statuses, allMet: statuses.every((s) => s.met) };
}


export type RequirementInput = {
  type: RequirementType;
  reference?: string | null;
  requiredValue?: number | null;
  label?: string | null;
};

const BUILDER_TYPES: readonly RequirementType[] = [
  "SKILL_LEVEL",
  "QUEST_POINTS",
  "COMBAT_POINTS",
  "DATE_REACHED",
  "QUESTLINE_COMPLETED",
  "QUEST_COMPLETED",
  "COLLECTION_ITEM",
  "MANUAL",
];

/** Validate a requirement definition; returns a normalized copy. */
export function validateRequirementInput(input: RequirementInput, isSkillKey: (k: string) => boolean): Required<RequirementInput> {
  if (!BUILDER_TYPES.includes(input.type)) throw new RequirementError("Unknown requirement type.");
  const reference = input.reference?.trim() || null;
  const value = input.requiredValue ?? null;
  const label = input.label?.trim() || null;
  switch (input.type) {
    case "SKILL_LEVEL":
      if (!reference || !isSkillKey(reference)) throw new RequirementError("Choose a Skill for the level requirement.");
      if (!Number.isInteger(value) || value! < 2 || value! > 99) throw new RequirementError("Skill level requirements must be between 2 and 99.");
      break;
    case "QUEST_POINTS":
    case "COMBAT_POINTS":
      if (!Number.isInteger(value) || value! < 1) throw new RequirementError("Point requirements must be a positive whole number.");
      break;
    case "DATE_REACHED":
      if (!reference || !/^\d{4}-\d{2}-\d{2}$/.test(reference)) throw new RequirementError("Date requirements need a valid date.");
      break;
    case "MANUAL":
      if (!label) throw new RequirementError("Describe the manual requirement.");
      if (label.length > 200) throw new RequirementError("Requirement descriptions must be 200 characters or fewer.");
      break;
    default:
      if (!reference) throw new RequirementError("This requirement needs something to point to.");
  }
  return { type: input.type, reference, requiredValue: value, label };
}

export class RequirementError extends GameRuleError {
  constructor(message: string) {
    super(message, "INVALID_REQUIREMENT");
  }
}
