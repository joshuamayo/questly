import Image from "next/image";
import type { ReactNode } from "react";
import { artUrl } from "@/server/art";
import { WorldVista } from "./WorldVista";

/**
 * Scenic screen header: banner artwork (art slot `banners/<slot>`, falling back
 * to the generic banner, then to the code-drawn vista), a large serif title,
 * and a one-line tagline.
 */
export function PageBanner({
  slot,
  title,
  tagline,
  children,
}: {
  slot: string;
  title: string;
  tagline?: ReactNode;
  children?: ReactNode;
}) {
  const url = artUrl(`banners/${slot}`) ?? artUrl("banners/default");
  return (
    <header className="relative isolate -mx-3 -mt-4 mb-4 overflow-hidden sm:-mx-5 lg:-mx-6 lg:-mt-0">
      <div aria-hidden className="q-vista absolute inset-y-0 right-0 -z-10 w-full lg:w-[72%]">
        {url ? (
          <Image src={url} alt="" fill priority unoptimized sizes="75vw" className="q-pixel object-cover object-center" />
        ) : (
          <WorldVista />
        )}
      </div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--color-backdrop)_18%,rgb(11_14_19/0.75)_45%,rgb(11_14_19/0.15)_80%),linear-gradient(0deg,var(--color-backdrop),transparent_45%)]"
      />
      <div className="px-3 pb-6 pt-6 sm:px-5 lg:px-6 lg:pb-8 lg:pt-7">
        <h1 className="q-title q-engraved text-display-lg lg:text-display-xl">{title}</h1>
        {tagline && <p className="mt-1 max-w-2xl text-lg text-text-primary [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">{tagline}</p>}
        {children}
      </div>
    </header>
  );
}
