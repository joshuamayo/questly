/**
 * Meta progression sync: evaluates every auto-tracked Combat Achievement,
 * Collection item, and Title against current metrics and records anything
 * newly earned. Idempotent — unique keys and ledger idempotency keys mean
 * nothing is ever awarded twice. Returns what is new, for celebrations.
 */

import { eq } from "drizzle-orm";
import { ruleProgress, type TrackingRule } from "@/game/metrics";
import type { CombatAchievementTier } from "@/game/vocabulary";
import type { Db } from "../db/client";
import {
  activityEvents,
  characterCollectionItems,
  characterCombatAchievements,
  characterTitles,
  collectionItems,
  combatAchievements,
  titles,
} from "../db/schema";
import { recordProgression } from "../progression/service";
import { computeMetrics } from "./metrics";

export type MetaUnlocks = {
  achievements: { key: string; title: string; tier: CombatAchievementTier; combatPoints: number }[];
  collection: { key: string; title: string; rarity: string; icon: string }[];
  titles: { key: string; name: string }[];
};

export function emptyUnlocks(): MetaUnlocks {
  return { achievements: [], collection: [], titles: [] };
}

export async function syncProgression(db: Db, characterId: string): Promise<MetaUnlocks> {
  const result = emptyUnlocks();
  const [achievementDefs, itemDefs, titleDefs] = await Promise.all([
    db.select().from(combatAchievements),
    db.select().from(collectionItems),
    db.select().from(titles),
  ]);

  // Several passes: earning achievements can satisfy "complete N achievements".
  for (let pass = 0; pass < 4; pass++) {
    const metrics = await computeMetrics(db, characterId);
    const [ownedCa, ownedItems, ownedTitles] = await Promise.all([
      db.select({ key: characterCombatAchievements.achievementKey }).from(characterCombatAchievements).where(eq(characterCombatAchievements.characterId, characterId)),
      db.select({ key: characterCollectionItems.itemKey }).from(characterCollectionItems).where(eq(characterCollectionItems.characterId, characterId)),
      db.select({ key: characterTitles.titleKey }).from(characterTitles).where(eq(characterTitles.characterId, characterId)),
    ]);
    const hasCa = new Set(ownedCa.map((r) => r.key));
    const hasItem = new Set(ownedItems.map((r) => r.key));
    const hasTitle = new Set(ownedTitles.map((r) => r.key));
    let changed = false;

    for (const a of achievementDefs) {
      if (hasCa.has(a.key) || !ruleProgress(a.rule as TrackingRule, metrics).complete) continue;
      const inserted = await db.insert(characterCombatAchievements).values({ characterId, achievementKey: a.key }).onConflictDoNothing().returning();
      if (!inserted.length) continue;
      await recordProgression(db, characterId, {
        kind: "COMBAT_POINTS",
        amount: a.combatPoints,
        sourceType: "COMBAT_ACHIEVEMENT",
        sourceId: a.key,
        idempotencyKey: `ca:${a.key}`,
        metadata: { title: a.title, tier: a.tier },
      });
      await db.insert(activityEvents).values({
        characterId,
        type: "COMBAT_ACHIEVEMENT_COMPLETED",
        entityId: a.key,
        payload: { title: a.title, tier: a.tier, combatPoints: a.combatPoints },
      });
      result.achievements.push({ key: a.key, title: a.title, tier: a.tier as CombatAchievementTier, combatPoints: a.combatPoints });
      changed = true;
    }

    for (const item of itemDefs) {
      if (!item.rule || hasItem.has(item.key) || !ruleProgress(item.rule as TrackingRule, metrics).complete) continue;
      const inserted = await db.insert(characterCollectionItems).values({ characterId, itemKey: item.key, source: "AUTO" }).onConflictDoNothing().returning();
      if (!inserted.length) continue;
      await db.insert(activityEvents).values({
        characterId,
        type: "COLLECTION_ITEM_OBTAINED",
        entityId: item.key,
        payload: { title: item.title, rarity: item.rarity },
      });
      result.collection.push({ key: item.key, title: item.title, rarity: item.rarity, icon: item.icon });
      changed = true;
    }

    for (const t of titleDefs) {
      if (!t.rule || hasTitle.has(t.key) || !ruleProgress(t.rule as TrackingRule, metrics).complete) continue;
      const inserted = await db.insert(characterTitles).values({ characterId, titleKey: t.key }).onConflictDoNothing().returning();
      if (!inserted.length) continue;
      await db.insert(activityEvents).values({ characterId, type: "TITLE_UNLOCKED", entityId: t.key, payload: { name: t.name } });
      result.titles.push({ key: t.key, name: t.name });
      changed = true;
    }

    if (!changed) break;
  }
  return result;
}
