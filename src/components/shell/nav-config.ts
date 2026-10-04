import type { SpriteName } from "@/components/icons/sprites";

export type NavDestination = { href: string; label: string; icon: SpriteName };

/** The four primary destinations (CLAUDE.md §6). Do not add items. */
export const PRIMARY_NAV: readonly NavDestination[] = [
  { href: "/", label: "Quest Log", icon: "quests" },
  { href: "/reward-shop", label: "Reward Shop", icon: "shop" },
  { href: "/completed", label: "Completed", icon: "diaries" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
