import { cx } from "@/lib/cx";
import { PixelIcon } from "./PixelIcon";
import { SPRITES, type SpriteName } from "./sprites";

const FALLBACK: SpriteName = "quests";

/** A pixel icon set in a recessed stone tile. */
export function IconTile({
  icon,
  size = 40,
  framed = true,
  label,
  className,
}: {
  icon: string;
  size?: number;
  framed?: boolean;
  label?: string;
  className?: string;
}) {
  const name = (icon in SPRITES ? icon : FALLBACK) as SpriteName;
  if (!framed) return <PixelIcon name={name} size={size} label={label} className={className} />;
  return (
    <span
      className={cx(
        "q-well inline-flex shrink-0 items-center justify-center border border-border-dark",
        className,
      )}
      style={{ width: size + 14, height: size + 14 }}
    >
      <PixelIcon name={name} size={size} label={label} />
    </span>
  );
}
