/**
 * Canonical V1 Skills (CLAUDE.md §4, Product Spec §4.2). Seed content: user
 * progression references these by stable key and never mutates them.
 * Do not add Skills here without explicit product approval.
 */

import type { SkillKey } from "../vocabulary";

export type SkillDefinition = {
  key: SkillKey;
  name: string;
  description: string;
  /** What this Skill measures, in one line, for compact surfaces. */
  motto: string;
  /** Icon id rendered by the UI's pixel-art icon set. */
  icon: string;
  /** Art direction for the icon and skill accents. */
  artDirection: string;
  sortOrder: number;
};

export const SKILL_DEFINITIONS: readonly SkillDefinition[] = [
  {
    key: "creator",
    name: "Creator",
    description:
      "Content creation, publishing, scripting, recording, and editing. Every story told and every work released.",
    motto: "What you make and release into the world.",
    icon: "skill-creator",
    artDirection: "A quill crossed over an inked scroll; warm ember accents.",
    sortOrder: 1,
  },
  {
    key: "business",
    name: "Business",
    description:
      "Products, companies, sales, operations, and sponsorships. Building ventures that stand on their own.",
    motto: "The ventures you build and trade.",
    icon: "skill-business",
    artDirection: "A merchant's hanging shop sign on a timber bracket; gold and timber.",
    sortOrder: 2,
  },
  {
    key: "finance",
    name: "Finance",
    description:
      "Financial planning, investing, taxes, and financial administration. Tending the treasury.",
    motto: "How well you keep the treasury.",
    icon: "skill-finance",
    artDirection: "A tidy stack of gold coins beside a sealed coin pouch.",
    sortOrder: 3,
  },
  {
    key: "fitness",
    name: "Fitness",
    description: "Training and physical goals. Strength, endurance, and the body that carries you.",
    motto: "The strength you train.",
    icon: "skill-fitness",
    artDirection: "An iron kettlebell with a worn leather grip.",
    sortOrder: 4,
  },
  {
    key: "home",
    name: "Home",
    description: "Home projects, maintenance, and organization. Raising and keeping your stronghold.",
    motto: "The stronghold you raise and keep.",
    icon: "skill-home",
    artDirection: "A small timber-framed cottage with a lit window and chimney smoke.",
    sortOrder: 5,
  },
  {
    key: "focus",
    name: "Focus",
    description:
      "Execution quality, deep work, deadline performance, and consistency. Not what you accomplished — how effectively you executed.",
    motto: "How effectively you execute.",
    icon: "skill-focus",
    artDirection: "An hourglass with teal sand inside a brass frame.",
    sortOrder: 6,
  },
];
