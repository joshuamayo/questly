import type { Db } from "../db/client";
import { questDateChanges } from "../db/schema";

/** Record a target/deadline change so the original dates are never lost. */
export async function recordDateChange(
  db: Db,
  questId: string,
  field: "TARGET" | "DEADLINE",
  oldValue: string | null,
  newValue: string | null,
  reason: string,
) {
  if (oldValue === newValue) return;
  await db.insert(questDateChanges).values({ questId, field, oldValue, newValue, reason });
}
