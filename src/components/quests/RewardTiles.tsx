import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { formatNumber } from "@/lib/format";
import { cx } from "@/lib/cx";

/** XP / GP / QP reward tiles, as on the mockups' reward panels. */
export function RewardTiles({
  rewards,
  skillKey,
  skillName,
  tone = "dark",
  earned = false,
  className,
}: {
  rewards: { xp: number; gp: number; qp: number };
  skillKey: string;
  skillName: string;
  tone?: "dark" | "parchment";
  earned?: boolean;
  className?: string;
}) {
  const tile =
    tone === "dark"
      ? "q-tile text-text-primary"
      : "rounded-sm border border-parchment-400/70 bg-parchment-50/50 text-parchment-ink shadow-[inset_0_1px_3px_rgb(90_60_20/0.2)]";
  const sub = tone === "dark" ? "text-text-secondary" : "text-parchment-ink-soft";
  const items = [
    { key: "xp", icon: <SkillIcon icon={`skill-${skillKey}`} size={34} framed={false} />, value: `+${formatNumber(rewards.xp)}`, label: `${skillName} XP` },
    { key: "gp", icon: <PixelIcon name="gp" size={34} />, value: `+${formatNumber(rewards.gp)}`, label: "GP" },
    { key: "qp", icon: <PixelIcon name="qp" size={34} />, value: `+${formatNumber(rewards.qp)}`, label: "Quest Points" },
  ];
  return (
    <ul className={cx("grid grid-cols-3 gap-2", className)} aria-label={earned ? "Rewards earned" : "Rewards on completion"}>
      {items.map((i) => (
        <li key={i.key} className={cx("flex flex-col items-center gap-1 px-1 py-3 text-center", tile)}>
          {i.icon}
          <span className="q-title text-xl leading-none">{i.value}</span>
          <span className={cx("text-xs", sub)}>{i.label}</span>
        </li>
      ))}
    </ul>
  );
}
