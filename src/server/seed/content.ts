/**
 * Seeds global content definitions (Skills, Titles, Capes). Idempotent:
 * definitions are upserted from the canonical content modules in src/game/content.
 */

import { sql } from "drizzle-orm";
import { CAPE_DEFINITIONS, TITLE_DEFINITIONS } from "@/game/content/cosmetics";
import { SKILL_DEFINITIONS } from "@/game/content/skills";
import type { Db } from "../db/client";
import { capes, skills, titles } from "../db/schema";

const excluded = (column: string) => sql.raw(`excluded.${column}`);

export async function seedContent(db: Db) {
  await db.transaction(async (tx) => {
    await tx
      .insert(skills)
      .values(SKILL_DEFINITIONS.map((s) => ({ ...s })))
      .onConflictDoUpdate({
        target: skills.key,
        set: {
          name: excluded("name"),
          description: excluded("description"),
          motto: excluded("motto"),
          icon: excluded("icon"),
          artDirection: excluded("art_direction"),
          sortOrder: excluded("sort_order"),
        },
      });
    await tx
      .insert(titles)
      .values(TITLE_DEFINITIONS.map((t) => ({ ...t })))
      .onConflictDoUpdate({
        target: titles.key,
        set: {
          name: excluded("name"),
          description: excluded("description"),
          isStarter: excluded("is_starter"),
          sortOrder: excluded("sort_order"),
        },
      });
    await tx
      .insert(capes)
      .values(CAPE_DEFINITIONS.map((c) => ({ ...c })))
      .onConflictDoUpdate({
        target: capes.key,
        set: {
          name: excluded("name"),
          description: excluded("description"),
          skillKey: excluded("skill_key"),
          sortOrder: excluded("sort_order"),
        },
      });
  });
}
