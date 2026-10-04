import type { SkillKey } from "@/game/vocabulary";

/** CSS color token for a Skill's identity color. Always pair with icon + name. */
export function skillColor(key: SkillKey | string): string {
  return `var(--color-skill-${key})`;
}
