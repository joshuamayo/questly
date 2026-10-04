import { cx } from "@/lib/cx";

/*
 * Original Questly landscape: dusk sky, distant peaks, a hilltop keep with lit
 * windows, pine forest, and a winding road. Pure SVG (no raster assets),
 * stepped shapes for a restrained pixel-art feel. Decorative only.
 */

const STARS: Array<[number, number, number]> = [
  [18, 10, 1], [44, 22, 1], [71, 8, 2], [96, 30, 1], [128, 14, 1], [152, 6, 1], [181, 24, 2],
  [205, 11, 1], [238, 19, 1], [262, 6, 1], [289, 27, 1], [306, 12, 2], [114, 40, 1], [224, 36, 1],
  [-44, 16, 1], [-20, 30, 1], [-8, 8, 2], [330, 20, 1], [352, 9, 1], [372, 32, 1],
];

/** Builds a stepped ridge path from [x, y] points (horizontal-then-vertical steps). */
function stepped(points: Array<[number, number]>, bottom = 140): string {
  let d = `M${points[0][0]} ${bottom} L${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) d += ` H${points[i][0]} V${points[i][1]}`;
  return `${d} V${bottom} Z`;
}

function pine(x: number, base: number, h: number): string {
  const w = Math.round(h * 0.5);
  const tiers = 4;
  let d = "";
  for (let t = 0; t < tiers; t++) {
    const tierW = Math.max(2, Math.round(w * (1 - t / tiers)));
    const y = base - Math.round((h * t) / tiers) - Math.round(h / tiers);
    d += `M${x - tierW / 2} ${y + Math.round(h / tiers)} H${x + tierW / 2} V${y + 2} H${x + 1} V${y} H${x - 1} V${y + 2} H${x - tierW / 2} Z `;
  }
  return d;
}

export function WorldVista({ className }: { className?: string }) {
  const farPeaks: Array<[number, number]> = [
    [-60, 72], [-48, 64], [-36, 56], [-24, 62], [-12, 70], [0, 78], [14, 70], [26, 62], [38, 54], [48, 60], [60, 66], [74, 58], [86, 48], [96, 42], [106, 50],
    [118, 58], [132, 64], [148, 56], [160, 50], [172, 44], [182, 38], [194, 46], [208, 54], [222, 62],
    [238, 56], [252, 50], [266, 58], [280, 64], [296, 58], [310, 66], [320, 60], [334, 52], [346, 46], [358, 54], [370, 62], [382, 68],
  ];
  const hills: Array<[number, number]> = [
    [-60, 90], [-40, 94], [-20, 96], [0, 98], [20, 94], [40, 90], [60, 92], [80, 96], [100, 92], [120, 86], [140, 82], [160, 80], [180, 82],
    [200, 86], [220, 90], [240, 88], [260, 84], [280, 88], [300, 92], [320, 90], [340, 88], [360, 92], [382, 94],
  ];
  const near: Array<[number, number]> = [
    [-60, 114], [-36, 112], [-12, 116], [0, 116], [24, 112], [48, 114], [72, 118], [96, 116], [120, 112], [144, 110], [168, 112],
    [192, 116], [216, 114], [240, 110], [264, 112], [288, 116], [312, 114], [336, 110], [360, 114], [382, 118],
  ];
  const forest = [-50, -38, -24, 8, 18, 30, 40, 54, 236, 248, 262, 274, 288, 300, 312, 330, 344, 362, 376];

  return (
    <svg
      viewBox="-60 0 440 140"
      preserveAspectRatio="xMidYMid slice"
      className={cx("q-pixel h-full w-full", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="q-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-teal-700)" }} />
          <stop offset="0.45" style={{ stopColor: "var(--color-stone-800)" }} />
          <stop offset="0.78" style={{ stopColor: "var(--color-timber-600)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-gold-500)" }} />
        </linearGradient>
        <radialGradient id="q-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" style={{ stopColor: "var(--color-gold-200)" }} />
          <stop offset="0.5" style={{ stopColor: "var(--color-gold-400)", stopOpacity: 0.5 }} />
          <stop offset="1" style={{ stopColor: "var(--color-gold-400)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      <rect x="-60" width="440" height="140" fill="url(#q-sky)" />
      <g style={{ fill: "var(--color-gold-100)" }} opacity="0.7">
        {STARS.map(([x, y, s]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={s} height={s} />
        ))}
      </g>
      <circle cx="232" cy="74" r="34" fill="url(#q-sun)" />
      <rect x="226" y="68" width="12" height="12" style={{ fill: "var(--color-gold-200)" }} />

      <path d={stepped(farPeaks)} style={{ fill: "var(--color-stone-700)" }} />
      <path
        d={stepped(farPeaks.map(([x, y]) => [x, y + 3]))}
        style={{ fill: "var(--color-stone-800)" }}
        opacity="0.9"
      />
      {/* Snow caps */}
      <g style={{ fill: "var(--color-parchment-200)" }} opacity="0.65">
        <rect x="96" y="42" width="10" height="2" />
        <rect x="182" y="38" width="12" height="2" />
        <rect x="172" y="44" width="10" height="1" />
      </g>

      <path d={stepped(hills)} style={{ fill: "var(--color-moss-700)" }} />

      {/* Hilltop keep */}
      <g style={{ fill: "var(--color-stone-950)" }}>
        <rect x="146" y="62" width="30" height="20" />
        <rect x="140" y="52" width="10" height="30" />
        <rect x="172" y="54" width="9" height="28" />
        <rect x="155" y="46" width="12" height="18" />
        <rect x="140" y="50" width="2" height="2" />
        <rect x="144" y="50" width="2" height="2" />
        <rect x="148" y="50" width="2" height="2" />
        <rect x="155" y="44" width="2" height="2" />
        <rect x="159" y="44" width="2" height="2" />
        <rect x="163" y="44" width="2" height="2" />
        <rect x="172" y="52" width="2" height="2" />
        <rect x="176" y="52" width="2" height="2" />
        <rect x="179" y="52" width="2" height="2" />
        <rect x="160" y="38" width="1" height="8" />
      </g>
      <rect x="161" y="38" width="5" height="3" style={{ fill: "var(--color-crimson-500)" }} />
      <g style={{ fill: "var(--color-gold-300)" }}>
        <rect x="143" y="58" width="2" height="3" />
        <rect x="159" y="52" width="2" height="3" />
        <rect x="175" y="60" width="2" height="3" />
        <rect x="153" y="68" width="2" height="2" />
        <rect x="166" y="70" width="2" height="2" />
      </g>
      <rect x="158" y="74" width="6" height="8" style={{ fill: "var(--color-timber-800)" }} />

      <path d={stepped(near)} style={{ fill: "var(--color-moss-600)" }} />
      {/* Winding road toward the keep */}
      <path
        d="M150 140 V132 H154 V124 H158 V116 H160 V104 H162 V90 H164 V82 H160 V90 H158 V104 H154 V116 H148 V124 H142 V132 H136 V140 Z"
        style={{ fill: "var(--color-parchment-400)" }}
        opacity="0.75"
      />

      <g style={{ fill: "var(--color-moss-700)" }}>
        {forest.map((x, i) => (
          <path key={x} d={pine(x, 124 + (i % 3) * 2, 22 + (i % 4) * 4)} />
        ))}
      </g>
      <g style={{ fill: "var(--color-stone-950)" }} opacity="0.85">
        {[-56, -30, 2, 22, 46, 280, 304, 340, 368].map((x, i) => (
          <path key={x} d={pine(x, 142, 30 + (i % 2) * 8)} />
        ))}
      </g>

      {/* Foreground ground band blends into the panel below. */}
      <rect x="-60" y="132" width="440" height="8" style={{ fill: "var(--color-stone-950)" }} opacity="0.8" />
    </svg>
  );
}
