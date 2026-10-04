import Image from "next/image";
import type { AvatarConfig } from "@/game/avatar";
import { cx } from "@/lib/cx";
import { AvatarSprite } from "./AvatarSprite";

/**
 * Character artwork with art-slot fallback: uses delivered artwork
 * (public/art/character/*) when present, otherwise the pixel avatar.
 */
export function CharacterFull({
  avatar,
  name,
  url,
  height,
  className,
}: {
  avatar: AvatarConfig;
  name: string;
  url: string | null;
  height: number;
  className?: string;
}) {
  const width = Math.round((height * 2) / 3);
  if (url) {
    return (
      <span className={cx("relative inline-block", className)} style={{ width, height }}>
        <Image src={url} alt={`${name}'s character`} fill unoptimized sizes={`${width}px`} className="q-pixel object-contain object-bottom" />
      </span>
    );
  }
  return <AvatarSprite avatar={avatar} name={name} height={height} className={className} />;
}

export function CharacterBust({
  avatar,
  name,
  url,
  size,
}: {
  avatar: AvatarConfig;
  name: string;
  url: string | null;
  size: number;
}) {
  if (url) {
    return (
      <span className="relative inline-block overflow-hidden" style={{ width: size, height: size }}>
        <Image src={url} alt={`${name}'s portrait`} fill unoptimized sizes={`${size}px`} className="q-pixel object-cover" />
      </span>
    );
  }
  // Crop the pixel avatar to head and shoulders.
  return (
    <span className="relative inline-flex items-start justify-center overflow-hidden" style={{ width: size, height: size }}>
      <AvatarSprite avatar={avatar} name={name} height={size * 1.9} className="shrink-0" />
    </span>
  );
}
