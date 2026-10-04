/**
 * Character read model. Turns persisted state into the view data every screen
 * uses, running all level math through the game engine exactly once.
 */

import { and, asc, desc, eq } from "drizzle-orm";
import { normalizeAvatar, type AvatarConfig } from "@/game/avatar";
import { adventureDay, describeAccountAge, MAX_TOTAL_LEVEL, totalLevel, totalXp } from "@/game/character";
import { CharacterNotFoundError } from "@/game/errors";
import { isSkillKey, type SkillKey } from "@/game/vocabulary";
import { getLevelProgress, getMasteryProgress, type LevelProgress, type MasteryProgress } from "@/game/xp";
import type { Db } from "../db/client";
import { activityEvents, capes, characterSkills, characters, progressionTransactions, skills, titles } from "../db/schema";

export type SkillSheet = {
  key: SkillKey;
  name: string;
  description: string;
  motto: string;
  icon: string;
  progress: LevelProgress;
  mastery: MasteryProgress;
};

export type CharacterSheet = {
  id: string;
  displayName: string;
  avatar: AvatarConfig;
  createdAt: string;
  accountAge: string;
  adventureDay: number;
  title: { key: string; name: string } | null;
  cape: { key: string; name: string } | null;
  gp: { balance: number; lifetimeEarned: number; lifetimeSpent: number };
  questPoints: number;
  combatPoints: number;
  totalLevel: number;
  maxTotalLevel: number;
  totalXp: number;
  skills: SkillSheet[];
};

export type CharacterStatus = Pick<
  CharacterSheet,
  "id" | "displayName" | "avatar" | "title" | "totalLevel" | "maxTotalLevel" | "questPoints" | "combatPoints"
> & { gpBalance: number };

/**
 * Resolves the active character. Phase 1 is single-player: the earliest
 * character is the player. This is the seam where authentication (e.g.
 * Supabase Auth → characters.auth_subject) plugs in later.
 */
export async function resolveCurrentCharacterId(db: Db): Promise<string> {
  const [row] = await db.select({ id: characters.id }).from(characters).orderBy(asc(characters.createdAt)).limit(1);
  if (!row) throw new CharacterNotFoundError();
  return row.id;
}

export async function getCharacterSheet(db: Db, characterId: string, now = new Date()): Promise<CharacterSheet> {
  const [row] = await db
    .select({
      character: characters,
      titleName: titles.name,
      capeName: capes.name,
    })
    .from(characters)
    .leftJoin(titles, eq(titles.key, characters.equippedTitleKey))
    .leftJoin(capes, eq(capes.key, characters.equippedCapeKey))
    .where(eq(characters.id, characterId));
  if (!row) throw new CharacterNotFoundError(characterId);
  const c = row.character;

  const [allSkills, xpRows] = await Promise.all([
    db.select().from(skills).orderBy(asc(skills.sortOrder)),
    db
      .select({ skillKey: characterSkills.skillKey, xp: characterSkills.xp })
      .from(characterSkills)
      .where(eq(characterSkills.characterId, characterId)),
  ]);
  // A missing character_skills row means 0 XP (Level 1).
  const xpByKey = new Map(xpRows.map((r) => [r.skillKey, r.xp]));
  const sheetSkills: SkillSheet[] = allSkills
    .filter((s) => isSkillKey(s.key))
    .map((s) => ({
      key: s.key as SkillKey,
      name: s.name,
      description: s.description,
      motto: s.motto,
      icon: s.icon,
      progress: getLevelProgress(xpByKey.get(s.key) ?? 0),
      mastery: getMasteryProgress(xpByKey.get(s.key) ?? 0),
    }));
  const xpMap = Object.fromEntries(sheetSkills.map((s) => [s.key, s.progress.totalXp]));

  return {
    id: c.id,
    displayName: c.displayName,
    avatar: normalizeAvatar(c.avatarConfig),
    createdAt: c.createdAt.toISOString(),
    accountAge: describeAccountAge(c.createdAt, now),
    adventureDay: adventureDay(c.createdAt, now),
    title: c.equippedTitleKey && row.titleName ? { key: c.equippedTitleKey, name: row.titleName } : null,
    cape: c.equippedCapeKey && row.capeName ? { key: c.equippedCapeKey, name: row.capeName } : null,
    gp: { balance: c.gpBalance, lifetimeEarned: c.lifetimeGpEarned, lifetimeSpent: c.lifetimeGpSpent },
    questPoints: c.questPoints,
    combatPoints: c.combatPoints,
    totalLevel: totalLevel(xpMap),
    maxTotalLevel: MAX_TOTAL_LEVEL,
    totalXp: totalXp(xpMap),
    skills: sheetSkills,
  };
}

export function toCharacterStatus(sheet: CharacterSheet): CharacterStatus {
  return {
    id: sheet.id,
    displayName: sheet.displayName,
    avatar: sheet.avatar,
    title: sheet.title,
    totalLevel: sheet.totalLevel,
    maxTotalLevel: sheet.maxTotalLevel,
    questPoints: sheet.questPoints,
    combatPoints: sheet.combatPoints,
    gpBalance: sheet.gp.balance,
  };
}

export type ChronicleEntry = {
  id: string;
  type: string;
  createdAt: string;
  /** Player-facing sentence. */
  text: string;
};

/** Recent account events for the World chronicle. Only real, recorded events. */
export async function getRecentChronicle(db: Db, characterId: string, limit = 6): Promise<ChronicleEntry[]> {
  const [rows, skillRows] = await Promise.all([
    db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.characterId, characterId))
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit),
    db.select({ key: skills.key, name: skills.name }).from(skills),
  ]);
  const skillName = new Map(skillRows.map((s) => [s.key, s.name]));
  return rows.map((e) => {
    const p = (e.payload ?? {}) as Record<string, unknown>;
    let text: string;
    switch (e.type) {
      case "CHARACTER_CREATED":
        text = "Your adventure began.";
        break;
      case "LEVEL_UP": {
        const name = skillName.get(String(p.skillKey)) ?? "A Skill";
        text = `${name} reached Level ${p.toLevel}.`;
        break;
      }
      default:
        text = e.type.replaceAll("_", " ").toLowerCase();
    }
    return { id: e.id, type: e.type, createdAt: e.createdAt.toISOString(), text };
  });
}

export type XpEntry = {
  id: string;
  skillKey: SkillKey;
  amount: number;
  /** Player-facing description of where the XP came from. */
  source: string;
  createdAt: string;
};

const SOURCE_LABELS: Record<string, string> = {
  QUEST: "Quest completed",
  QUESTLINE: "Questline completed",
  FOCUS_SESSION: "Focus session",
  BOSS: "Boss defeated",
  DIARY: "Diary reward",
  COMBAT_ACHIEVEMENT: "Combat Achievement",
  COLLECTION: "Collection reward",
  SYSTEM: "Granted",
  SEED_DEMO: "Demo progression",
};

/** Most recent XP ledger entries (real transactions only), newest first. */
export async function getRecentXp(db: Db, characterId: string, limit = 5): Promise<XpEntry[]> {
  const rows = await db
    .select()
    .from(progressionTransactions)
    .where(and(eq(progressionTransactions.characterId, characterId), eq(progressionTransactions.kind, "XP")))
    .orderBy(desc(progressionTransactions.seq))
    .limit(limit);
  return rows
    .filter((r) => r.skillKey && isSkillKey(r.skillKey))
    .map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const title = typeof meta.questTitle === "string" ? meta.questTitle : null;
      return {
        id: r.id,
        skillKey: r.skillKey as SkillKey,
        amount: r.amount,
        source: title ?? SOURCE_LABELS[r.sourceType] ?? r.sourceType,
        createdAt: r.createdAt.toISOString(),
      };
    });
}
