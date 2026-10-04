"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Map of art slot → delivered file URL (or null), resolved on the server. */
const ArtContext = createContext<Record<string, string | null>>({});

export function ArtProvider({ manifest, children }: { manifest: Record<string, string | null>; children: ReactNode }) {
  return <ArtContext.Provider value={manifest}>{children}</ArtContext.Provider>;
}

export function useArt(slot: string | undefined): string | null {
  const manifest = useContext(ArtContext);
  return slot ? (manifest[slot] ?? null) : null;
}
