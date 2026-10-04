import { describe, expect, it } from "vitest";
import { evaluateRequirement, evaluateRequirements, validateRequirementInput, type Requirement, type RequirementContext } from "./requirements";
import { isSkillKey } from "./vocabulary";

const ctx: RequirementContext = {
  skillLevels: { business: 52, creator: 10 },
  skillNames: { business: "Business", creator: "Creator" },
  questPoints: 40,
  combatPoints: 12,
  completedQuestIds: new Set(["q1"]),
  questTitles: { q1: "Brand Foundation", q2: "Store Setup" },
  completedQuestlineIds: new Set(["ql1"]),
  questlineTitles: { ql1: "Home Base", ql2: "MangoStax" },
  collectionItemKeys: new Set(["first-quest"]),
  collectionItemTitles: { "first-quest": "First Quest", "first-boss": "First Boss Defeated" },
  today: "2026-10-04",
};
const req = (r: Partial<Requirement>): Requirement => ({ id: "r", type: "MANUAL", reference: null, requiredValue: null, label: null, manualMet: false, ...r });

describe("requirements engine", () => {
  it("evaluates skill level requirements", () => {
    expect(evaluateRequirement(req({ type: "SKILL_LEVEL", reference: "business", requiredValue: 50 }), ctx)).toMatchObject({
      description: "Business Level 50",
      current: "Level 52",
      required: "Level 50",
      met: true,
    });
    expect(evaluateRequirement(req({ type: "SKILL_LEVEL", reference: "creator", requiredValue: 40 }), ctx).met).toBe(false);
  });

  it("evaluates Quest and Questline requirements", () => {
    expect(evaluateRequirement(req({ type: "QUEST_COMPLETED", reference: "q1" }), ctx)).toMatchObject({ met: true, description: "Complete “Brand Foundation”" });
    expect(evaluateRequirement(req({ type: "QUEST_COMPLETED", reference: "q2" }), ctx).met).toBe(false);
    expect(evaluateRequirement(req({ type: "QUESTLINE_COMPLETED", reference: "ql1" }), ctx).met).toBe(true);
    expect(evaluateRequirement(req({ type: "QUESTLINE_COMPLETED", reference: "ql2" }), ctx).met).toBe(false);
  });

  it("evaluates Quest Point and Combat Point requirements", () => {
    expect(evaluateRequirement(req({ type: "QUEST_POINTS", requiredValue: 40 }), ctx)).toMatchObject({ met: true, current: "40 QP" });
    expect(evaluateRequirement(req({ type: "COMBAT_POINTS", requiredValue: 13 }), ctx)).toMatchObject({ met: false, current: "12 CP" });
  });

  it("evaluates Collection, date, and manual requirements", () => {
    expect(evaluateRequirement(req({ type: "COLLECTION_ITEM", reference: "first-quest" }), ctx).met).toBe(true);
    expect(evaluateRequirement(req({ type: "COLLECTION_ITEM", reference: "first-boss" }), ctx)).toMatchObject({ met: false, description: "Obtain First Boss Defeated" });
    expect(evaluateRequirement(req({ type: "DATE_REACHED", reference: "2026-10-04" }), ctx).met).toBe(true);
    expect(evaluateRequirement(req({ type: "DATE_REACHED", reference: "2026-10-05" }), ctx).met).toBe(false);
    expect(evaluateRequirement(req({ label: "Sponsor brief received", manualMet: true }), ctx)).toMatchObject({ met: true, description: "Sponsor brief received" });
  });

  it("requires every requirement to be met", () => {
    const r = evaluateRequirements([req({ manualMet: true, label: "A" }), req({ type: "QUEST_POINTS", requiredValue: 100 })], ctx);
    expect(r.allMet).toBe(false);
    expect(r.statuses).toHaveLength(2);
  });

  it("validates requirement definitions", () => {
    expect(() => validateRequirementInput({ type: "SKILL_LEVEL", reference: "family", requiredValue: 10 }, isSkillKey)).toThrow();
    expect(() => validateRequirementInput({ type: "SKILL_LEVEL", reference: "home", requiredValue: 100 }, isSkillKey)).toThrow();
    expect(() => validateRequirementInput({ type: "MANUAL", label: " " }, isSkillKey)).toThrow();
    expect(validateRequirementInput({ type: "QUEST_POINTS", requiredValue: 10 }, isSkillKey)).toMatchObject({ requiredValue: 10 });
  });
});
