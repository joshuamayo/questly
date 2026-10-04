/**
 * Art asset slots. Artwork lives in public/art/<slot>.<ext> (see
 * docs/ART_ASSETS.md). When a file exists it is used; otherwise components
 * render their code-drawn placeholder. Dropping a file in place requires no
 * code changes.
 */

import fs from "node:fs";
import path from "node:path";

const ART_ROOT = path.join(process.cwd(), "public", "art");
const EXTENSIONS = [".webp", ".png", ".jpg"];
const cache = new Map<string, string | null>();

/** Public URL for an art slot such as "banners/skills", or null if not delivered yet. */
export function artUrl(slot: string): string | null {
  if (process.env.NODE_ENV === "production" && cache.has(slot)) return cache.get(slot)!;
  let found: string | null = null;
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(path.join(ART_ROOT, `${slot}${ext}`))) {
      found = `/art/${slot}${ext}`;
      break;
    }
  }
  cache.set(slot, found);
  return found;
}

/** Resolve several slots at once, e.g. for passing to a client component. */
export function artUrls<K extends string>(slots: Record<K, string>): Record<K, string | null> {
  return Object.fromEntries(Object.entries(slots).map(([k, slot]) => [k, artUrl(slot as string)])) as Record<
    K,
    string | null
  >;
}
