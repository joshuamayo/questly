/**
 * Quest Board templates (Product Spec §31). Seed content: accepting a template
 * always creates a new Quest; the template itself is never modified.
 */

import type { QuestDifficulty, SkillKey } from "../vocabulary";

export type QuestTemplateDefinition = {
  key: string;
  title: string;
  description: string;
  skillKey: SkillKey | null;
  difficulty: QuestDifficulty | null;
  objectives: string[];
  icon: string;
  /** The "Custom Quest" entry opens Create Quest instead of accepting. */
  isCustom: boolean;
  sortOrder: number;
};

export const QUEST_TEMPLATES: readonly QuestTemplateDefinition[] = [
  {
    key: "publish-youtube-video",
    title: "Publish a YouTube Video",
    description:
      "An idea worth sharing waits to be released into the world. Script it, record it, shape it in the edit, and send it out.",
    skillKey: "creator",
    difficulty: "EXPERIENCED",
    objectives: ["Research the idea", "Write the script", "Record the video", "Edit the video", "Create the thumbnail", "Publish the video"],
    icon: "skill-creator",
    isCustom: false,
    sortOrder: 1,
  },
  {
    key: "launch-digital-product",
    title: "Launch a Digital Product",
    description:
      "Turn what you know into something others can buy. Build it, give it a storefront, and open the doors.",
    skillKey: "business",
    difficulty: "MASTER",
    objectives: ["Define the offer", "Build the first version", "Write the sales page", "Set up checkout", "Announce the launch"],
    icon: "skill-business",
    isCustom: false,
    sortOrder: 2,
  },
  {
    key: "complete-home-project",
    title: "Complete a Home Project",
    description: "Your stronghold has a project that has waited long enough. Gather the materials and see it through.",
    skillKey: "home",
    difficulty: "INTERMEDIATE",
    objectives: ["Plan the project", "Gather materials", "Do the work", "Clean up"],
    icon: "skill-home",
    isCustom: false,
    sortOrder: 3,
  },
  {
    key: "complete-tax-documents",
    title: "Complete Tax Documents",
    description: "The treasury's ledgers must be settled. Gather every record and file with confidence.",
    skillKey: "finance",
    difficulty: "EXPERIENCED",
    objectives: ["Gather income records", "Gather deductions and receipts", "Prepare the return", "Review and file"],
    icon: "skill-finance",
    isCustom: false,
    sortOrder: 4,
  },
  {
    key: "finish-workout-goal",
    title: "Finish a Workout Goal",
    description: "Set a training goal and earn it, one session at a time.",
    skillKey: "fitness",
    difficulty: "INTERMEDIATE",
    objectives: ["Choose the goal", "Plan the training", "Complete the training", "Hit the goal"],
    icon: "skill-fitness",
    isCustom: false,
    sortOrder: 5,
  },
  {
    key: "monthly-financial-review",
    title: "Monthly Financial Review",
    description: "Take stock of the treasury: what came in, what went out, and where it should go next.",
    skillKey: "finance",
    difficulty: "NOVICE",
    objectives: ["Review income and spending", "Reconcile accounts", "Set next month's plan"],
    icon: "skill-finance",
    isCustom: false,
    sortOrder: 6,
  },
  {
    key: "deep-work-sprint",
    title: "Deep Work Sprint",
    description: "Clear the field of distractions and give one important thing your undivided attention.",
    skillKey: "focus",
    difficulty: "NOVICE",
    objectives: ["Choose the one thing", "Remove distractions", "Complete the deep work session"],
    icon: "skill-focus",
    isCustom: false,
    sortOrder: 7,
  },
  {
    key: "custom-quest",
    title: "Custom Quest",
    description: "Author your own adventure from scratch.",
    skillKey: null,
    difficulty: null,
    objectives: [],
    icon: "quests",
    isCustom: true,
    sortOrder: 8,
  },
];
