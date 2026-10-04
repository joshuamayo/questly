import { cx } from "@/lib/cx";
import { SPRITE_PALETTE, SPRITES, type SpriteName } from "./sprites";

type Run = { x: number; y: number; w: number };

/** Collapse a pixel grid into horizontal runs grouped by color (fewer DOM nodes). */
export function gridToRuns(rows: readonly string[]): Map<string, Run[]> {
  const byColor = new Map<string, Run[]>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let w = 1;
      while (row[x + w] === ch) w++;
      if (ch !== ".") {
        const runs = byColor.get(ch) ?? [];
        runs.push({ x, y, w });
        byColor.set(ch, runs);
      }
      x += w;
    }
  });
  return byColor;
}

export function PixelGrid({
  rows,
  palette,
  className,
  title,
}: {
  rows: readonly string[];
  palette: Record<string, string>;
  className?: string;
  title?: string;
}) {
  const width = rows[0]?.length ?? 0;
  const runs = gridToRuns(rows);
  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      className={cx("q-pixel", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {[...runs.entries()].map(([ch, list]) => (
        <g key={ch} style={{ fill: palette[ch] }}>
          {list.map((r) => (
            <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/**
 * Pixel-art icon. Decorative by default (hidden from assistive tech); pass
 * `label` when the icon carries meaning on its own.
 */
export function PixelIcon({
  name,
  size = 24,
  label,
  className,
}: {
  name: SpriteName;
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <PixelGrid rows={SPRITES[name]} palette={SPRITE_PALETTE} title={label} className="h-full w-full" />
    </span>
  );
}
