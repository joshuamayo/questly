/**
 * Respawn (Product Spec §23): a recovery flow, never a punishment. This
 * module only decides when to suggest it; it never touches progression.
 */

import { RESPAWN_THRESHOLDS } from "./config/balance";

export type RespawnSuggestion = {
  suggested: boolean;
  trigger: "MISSED_WORKDAYS" | "QUESTS_NEED_ATTENTION" | null;
  missedWorkdays: number;
  questsNeedingAttention: number;
};

export function respawnSuggestion(
  input: { missedWorkdays: number; questsNeedingAttention: number; dismissedUntil: string | null; today: string; hasHistory: boolean },
  thresholds: { missedPlannedWorkdays: number; questsNeedingAttention: number } = RESPAWN_THRESHOLDS,
): RespawnSuggestion {
  const base = { missedWorkdays: input.missedWorkdays, questsNeedingAttention: input.questsNeedingAttention };
  if (!input.hasHistory || (input.dismissedUntil && input.today <= input.dismissedUntil)) return { suggested: false, trigger: null, ...base };
  if (input.missedWorkdays >= thresholds.missedPlannedWorkdays) return { suggested: true, trigger: "MISSED_WORKDAYS", ...base };
  if (input.questsNeedingAttention >= thresholds.questsNeedingAttention) return { suggested: true, trigger: "QUESTS_NEED_ATTENTION", ...base };
  return { suggested: false, trigger: null, ...base };
}
