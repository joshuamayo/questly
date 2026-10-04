import { SkillIcon } from "@/components/icons/SkillIcon";
import { skillColor } from "@/components/skills/skill-style";
import { cx } from "@/lib/cx";

export function SkillBadge({ skillKey, name, className }: { skillKey: string; name: string; className?: string }) {
  const color = skillColor(skillKey);
  return (
    <span
      className={cx("inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 text-xs font-bold uppercase tracking-wider", className)}
      style={{ borderColor: color, color, backgroundColor: `color-mix(in oklab, ${color}, transparent 85%)` }}
    >
      <SkillIcon icon={`skill-${skillKey}`} size={14} framed={false} />
      {name}
    </span>
  );
}
