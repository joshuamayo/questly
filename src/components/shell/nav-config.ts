import type { SpriteName } from "@/components/icons/sprites";

export type NavDestination = {
  href: string;
  label: string;
  icon: SpriteName;
  /** Whether the destination's system exists yet (false → placeholder screen). */
  available: boolean;
};

/** Canonical primary navigation (CLAUDE.md §4). Do not add items. */
export const PRIMARY_NAV: readonly NavDestination[] = [
  { href: "/", label: "World", icon: "world", available: true },
  { href: "/quests", label: "Quests", icon: "quests", available: true },
  { href: "/questlines", label: "Questlines", icon: "questlines", available: false },
  { href: "/skills", label: "Skills", icon: "skills", available: true },
  { href: "/achievement-diaries", label: "Achievement Diaries", icon: "diaries", available: false },
  { href: "/combat-achievements", label: "Combat Achievements", icon: "combat", available: false },
  { href: "/bosses", label: "Bosses", icon: "bosses", available: false },
  { href: "/collection-log", label: "Collection Log", icon: "collection", available: false },
  { href: "/reward-shop", label: "Reward Shop", icon: "shop", available: false },
];

export const CHARACTER_NAV: NavDestination = { href: "/character", label: "Character", icon: "character", available: true };
export const SETTINGS_NAV: NavDestination = { href: "/settings", label: "Settings", icon: "settings", available: false };

/** Mobile bottom bar: the destinations that matter most on a phone. */
export const MOBILE_TABS: readonly NavDestination[] = [PRIMARY_NAV[0], PRIMARY_NAV[1], PRIMARY_NAV[3], CHARACTER_NAV];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
