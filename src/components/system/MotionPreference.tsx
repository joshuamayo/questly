"use client";

import { useEffect } from "react";

/** Applies the player's motion setting to the whole document (dialogs included). */
export function MotionPreference({ motion }: { motion: "system" | "reduce" | "full" }) {
  useEffect(() => {
    document.documentElement.dataset.motion = motion;
  }, [motion]);
  return null;
}
