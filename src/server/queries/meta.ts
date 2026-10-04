/** Read models for Combat Achievements, Collection Log, and Titles. */

import { asc, eq } from "drizzle-orm";
import { ruleProgress, type RuleProgress, type TrackingRule } from "@/game/metrics";
import type { CombatAchievementTier } from "@/game/vocabulary";
import type { Db } from "../db/client";
import {
  capes,
  characterCollectionItems,
  characterCombatAchievements,
  characterTitles,
  collectionItems,
  combatAchievements,
  titles,
} from "../db/schema";
import { computeMetrics } from "../meta/metrics";

export type CombatAchievementView = {
  key: string;
  tier: CombatAchievementTier;
  title: string;
  description: string;
  combatPoints: number;
  progress: RuleProgress;
  completedAt: string | null;
};

export async function listCombatAchievements(db: Db, characterId: string): Promise<CombatAchievementView[]> {
  const [defs, owned, metrics] = await Promise.all([
    db.select().from(combatAchievements).orderBy(asc(combatAchievements.sortOrder)),
    db.select().from(characterCombatAchievements).where(eq(characterCombatAchievements.characterId, characterId)),
    computeMetrics(db, characterId),
  ]);
  const done = new Map(owned.map((o) => [o.achievementKey, o.completedAt]));
  return defs.map((d) => {
    const completedAt = done.get(d.key) ?? null;
    const progress = ruleProgress(d.rule as TrackingRule, metrics);
    return {
      key: d.key,
      tier: d.tier as CombatAchievementTier,
      title: d.title,
      description: d.description,
      combatPoints: d.combatPoints,
      // A recorded completion is permanent even if a metric later changes.
      progress: completedAt ? { ...progress, current: progress.target, percent: 100, complete: true } : progress,
      completedAt: completedAt?.toISOString() ?? null,
    };
  });
}

export type CollectionItemView = {
  key: string;
  category: string;
  /** Secret items not yet obtained have title/description hidden. */
  title: string;
  description: string;
  rarity: string;
  icon: string;
  secret: boolean;
  manual: boolean;
  state: "UNLOCKED" | "LOCKED" | "SECRET";
  unlockedAt: string | null;
  note: string;
  progress: RuleProgress | null;
};

export async function listCollection(db: Db, characterId: string): Promise<CollectionItemView[]> {
  const [defs, owned, metrics] = await Promise.all([
    db.select().from(collectionItems).orderBy(asc(collectionItems.sortOrder)),
    db.select().from(characterCollectionItems).where(eq(characterCollectionItems.characterId, characterId)),
    computeMetrics(db, characterId),
  ]);
  const byKey = new Map(owned.map((o) => [o.itemKey, o]));
  return defs.map((d) => {
    const mine = byKey.get(d.key);
    const state = mine ? "UNLOCKED" : d.secret ? "SECRET" : "LOCKED";
    const hidden = state === "SECRET";
    return {
      key: d.key,
      category: d.category,
      title: hidden ? "???" : d.title,
      description: hidden ? "A secret yet to be discovered." : d.description,
      rarity: d.rarity,
      icon: hidden ? "lock" : d.icon,
      secret: d.secret,
      manual: !d.rule,
      state,
      unlockedAt: mine?.unlockedAt.toISOString() ?? null,
      note: mine?.note ?? "",
      progress: !mine && !hidden && d.rule ? ruleProgress(d.rule as TrackingRule, metrics) : null,
    };
  });
}

export type TitleView = { key: string; name: string; description: string; owned: boolean; progress: RuleProgress | null };
export type CapeView = { key: string; name: string; skillKey: string | null; unlocked: boolean };

export async function listTitlesAndCapes(db: Db, characterId: string) {
  const [defs, owned, capeDefs, metrics] = await Promise.all([
    db.select().from(titles).orderBy(asc(titles.sortOrder)),
    db.select().from(characterTitles).where(eq(characterTitles.characterId, characterId)),
    db.select().from(capes).orderBy(asc(capes.sortOrder)),
    computeMetrics(db, characterId),
  ]);
  const has = new Set(owned.map((o) => o.titleKey));
  const titleViews: TitleView[] = defs.map((t) => ({
    key: t.key,
    name: t.name,
    description: t.description,
    owned: has.has(t.key),
    progress: !has.has(t.key) && t.rule ? ruleProgress(t.rule as TrackingRule, metrics) : null,
  }));
  const capeViews: CapeView[] = capeDefs.map((c) => ({
    key: c.key,
    name: c.name,
    skillKey: c.skillKey,
    unlocked: Boolean(c.skillKey && (metrics.skillLevels[c.skillKey] ?? 1) >= 99),
  }));
  return { titles: titleViews, capes: capeViews };
}
