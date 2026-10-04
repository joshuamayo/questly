import type { AvatarConfig } from "@/game/avatar";
import { PixelGrid } from "@/components/icons/PixelIcon";
import { cx } from "@/lib/cx";

/*
 * Pixel avatar composed from the character's avatar configuration.
 * Letters: H hair, F skin, f skin shade, E eyes, B beard, C tunic, c tunic
 * shade, b leather, G buckle, d trousers, K outline.
 */
const BASE: readonly string[] = [
  "................",
  ".....KKKKKK.....",
  "....KHHHHHHK....",
  "...KHHHHHHHHK...",
  "...KHFFFFFFHK...",
  "...KFFFFFFFFK...",
  "...KFEFFFFEFK...",
  "...KFFFFFFFFK...",
  "...KfFFFFFFfK...",
  "....KfFFFFfK....",
  ".....KKffKK.....",
  "...KKCCCCCCKK...",
  "..KCCCCCCCCCCK..",
  ".KCCKCCCCCCKCCK.",
  ".KCcKCCCCCCKcCK.",
  ".KccKCCCCCCKccK.",
  ".KFfKbbbGbbKfFK.",
  ".KKKKccccccKKKK.",
  "....KddKKddK....",
  "....KddKKddK....",
  "....KddKKddK....",
  "....KbbKKbbK....",
  "...KbbbKKbbbK...",
  "...KKKKKKKKKK...",
];

function withRows(rows: readonly string[], replacements: Record<number, string>): string[] {
  return rows.map((row, i) => replacements[i] ?? row);
}

export function avatarGrid(config: AvatarConfig): string[] {
  let rows = [...BASE];
  if (config.hairStyle === "bald") {
    rows = withRows(rows, { 2: "....KFFFFFFK....", 3: "...KFFFFFFFFK...", 4: "...KFFFFFFFFK..." });
  } else if (config.hairStyle === "long") {
    rows = withRows(rows, {
      5: "...KHFFFFFFHK...",
      6: "...KHEFFFFEHK...",
      7: "...KHFFFFFFHK...",
      8: "...KHFFFFFFHK...",
      9: "...KHKfFFfKHK...",
      10: "...KHKKffKKHK...",
    });
  }
  if (config.beard) {
    rows = withRows(rows, {
      8: rows[8].replace("KfFFFFFFfK", "KBFFFFFFBK"),
      9: "....KBBBBBBK....",
      10: rows[10].replace("KKffKK", "KKBBKK"),
    });
  }
  return rows;
}

const TUNIC: Record<AvatarConfig["tunicColor"], string> = {
  moss: "var(--color-moss-500)",
  teal: "var(--color-teal-600)",
  crimson: "var(--color-cloth-crimson)",
  royal: "var(--color-cloth-royal)",
  umber: "var(--color-cloth-umber)",
};

const shade = (color: string, amount = 22) => `color-mix(in oklab, ${color}, black ${amount}%)`;

export function avatarPalette(config: AvatarConfig): Record<string, string> {
  const skin = `var(--color-skin-${config.skinTone})`;
  const hair = `var(--color-hair-${config.hairColor})`;
  const tunic = TUNIC[config.tunicColor];
  return {
    K: "var(--color-border-dark)",
    H: hair,
    B: hair,
    F: skin,
    f: shade(skin, 18),
    E: "var(--color-border-dark)",
    C: tunic,
    c: shade(tunic, 28),
    b: "var(--color-timber-700)",
    G: "var(--color-gold-300)",
    d: "var(--color-stone-700)",
  };
}

export function AvatarSprite({
  avatar,
  name,
  height = 120,
  className,
}: {
  avatar: AvatarConfig;
  /** Character name for the accessible label. */
  name: string;
  height?: number;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex", className)} style={{ height, width: (height * 16) / 24 }}>
      <PixelGrid
        rows={avatarGrid(avatar)}
        palette={avatarPalette(avatar)}
        title={`${name}'s avatar`}
        className="h-full w-full drop-shadow-[0_4px_0_rgb(0_0_0/0.45)]"
      />
    </span>
  );
}
