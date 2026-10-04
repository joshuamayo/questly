"use server";

import { runAction } from "@/server/actions/run";
import { equipCape, equipTitle } from "@/server/collection/service";

export async function equipTitleAction(titleKey: string | null) {
  return runAction((db, c) => equipTitle(db, c, titleKey));
}

export async function equipCapeAction(capeKey: string | null) {
  return runAction((db, c) => equipCape(db, c, capeKey));
}
