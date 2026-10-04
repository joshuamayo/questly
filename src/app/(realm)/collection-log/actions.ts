"use server";

import { runAction } from "@/server/actions/run";
import { claimCollectionItem, setCollectionNote } from "@/server/collection/service";

export async function claimCollectionItemAction(itemKey: string, note: string) {
  return runAction((db, c) => claimCollectionItem(db, c, itemKey, note));
}

export async function setCollectionNoteAction(itemKey: string, note: string) {
  return runAction((db, c) => setCollectionNote(db, c, itemKey, note));
}
