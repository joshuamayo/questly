"use server";

import type { BalanceOverrides } from "@/game/settings";
import { runAction } from "@/server/actions/run";
import {
  addVacation,
  endVacation,
  removeVacation,
  updateBalance,
  updateDisplayName,
  updatePreferences,
  updateSchedule,
  type ScheduleInput,
} from "@/server/settings/service";
import { actionToday } from "@/server/today";

export async function updateDisplayNameAction(name: string) {
  return runAction((db, c) => updateDisplayName(db, c, name));
}

export async function updateScheduleAction(input: ScheduleInput) {
  return runAction(async (db, c) => {
    await updateSchedule(db, c, input);
  });
}

export async function updatePreferencesAction(input: { focusDefaultMinutes?: number; motion?: "system" | "reduce" | "full" }) {
  return runAction(async (db, c) => {
    await updatePreferences(db, c, input);
  });
}

export async function updateBalanceAction(overrides: BalanceOverrides) {
  return runAction(async (db, c) => {
    await updateBalance(db, c, overrides);
  });
}

export async function addVacationAction(input: { start: string; end: string | null }) {
  return runAction(async (db, c) => {
    await addVacation(db, c, input);
  });
}

export async function endVacationAction(index: number, localDate?: string) {
  return runAction(async (db, c) => {
    await endVacation(db, c, index, await actionToday(localDate));
  });
}

export async function removeVacationAction(index: number) {
  return runAction(async (db, c) => {
    await removeVacation(db, c, index);
  });
}
