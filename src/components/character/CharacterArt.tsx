import Image from "next/image";
import type { AvatarConfig } from "@/game/avatar";
import { AvatarSprite } from "./AvatarSprite";

/**
 * Character artwork with art-slot fallback: uses delivered artwork
 * (public/art/character/*) when present, otherwise the pixel avatar.
 */
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
