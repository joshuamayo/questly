/**
 * Collection Log manual claims and memories, plus Title and Cape equipping.
 * Unlocks are permanent; the primary key prevents duplicates.
 */

import { and, eq } from "drizzle-orm";
import { GameRuleError } from "@/game/errors";
import { getLevelProgress } from "@/game/xp";
import type { Db } from "../db/client";
import { activityEvents, capes, characterCollectionItems, characterSkills, characterTitles, characters, collectionItems } from "../db/schema";

export async function claimCollectionItem(db: Db, characterId: string, itemKey: string, note = "") {
  if (note.length > 2_000) throw new GameRuleError("Memories must be 2,000 characters or fewer.", "NOTE_TOO_LONG");
  return db.transaction(async (tx) => {
    const [item] = await tx.select().from(collectionItems).where(eq(collectionItems.key, itemKey));
    if (!item) throw new GameRuleError("That Collection item does not exist.", "ITEM_NOT_FOUND");
    if (item.rule) throw new GameRuleError("This item is obtained automatically when its requirement is met.", "ITEM_IS_AUTO");
    const inserted = await tx
      .insert(characterCollectionItems)
      .values({ characterId, itemKey, source: "MANUAL", note: note.trim() })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) throw new GameRuleError("You have already obtained this item.", "ITEM_OWNED");
    await tx.insert(activityEvents).values({ characterId, type: "COLLECTION_ITEM_OBTAINED", entityId: itemKey, payload: { title: item.title, rarity: item.rarity, manual: true } });
    return { key: item.key, title: item.title, rarity: item.rarity, icon: item.icon };
  });
}

export async function setCollectionNote(db: Db, characterId: string, itemKey: string, note: string) {
  if (note.length > 2_000) throw new GameRuleError("Memories must be 2,000 characters or fewer.", "NOTE_TOO_LONG");
  const updated = await db
    .update(characterCollectionItems)
    .set({ note: note.trim() })
    .where(and(eq(characterCollectionItems.characterId, characterId), eq(characterCollectionItems.itemKey, itemKey)))
    .returning();
  if (!updated.length) throw new GameRuleError("Obtain this item before adding a memory.", "ITEM_NOT_OWNED");
}

export async function equipTitle(db: Db, characterId: string, titleKey: string | null) {
  if (titleKey) {
    const [owned] = await db
      .select()
      .from(characterTitles)
      .where(and(eq(characterTitles.characterId, characterId), eq(characterTitles.titleKey, titleKey)));
    if (!owned) throw new GameRuleError("You have not earned that Title yet.", "TITLE_LOCKED");
  }
  await db.update(characters).set({ equippedTitleKey: titleKey }).where(eq(characters.id, characterId));
}

export async function equipCape(db: Db, characterId: string, capeKey: string | null) {
  if (capeKey) {
    const [cape] = await db.select().from(capes).where(eq(capes.key, capeKey));
    if (!cape || !cape.skillKey) throw new GameRuleError("That cape does not exist.", "CAPE_NOT_FOUND");
    const [skill] = await db
      .select()
      .from(characterSkills)
      .where(and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillKey, cape.skillKey)));
    if (getLevelProgress(skill?.xp ?? 0).level < 99) throw new GameRuleError("Skill Capes are earned at Level 99.", "CAPE_LOCKED");
  }
  await db.update(characters).set({ equippedCapeKey: capeKey }).where(eq(characters.id, characterId));
}
