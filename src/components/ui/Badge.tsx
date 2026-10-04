import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Tone = "gold" | "moss" | "teal" | "blue" | "crimson" | "stone" | "parchment";

const TONES: Record<Tone, string> = {
  gold: "border-gold-600 bg-gold-700/40 text-gold-200",
  moss: "border-moss-600 bg-moss-700/50 text-moss-300",
  teal: "border-teal-600 bg-teal-700/50 text-teal-300",
  blue: "border-blue-500 bg-blue-700/50 text-blue-300",
  crimson: "border-crimson-500 bg-crimson-700/50 text-crimson-300",
  stone: "border-stone-600 bg-stone-800 text-text-secondary",
  parchment: "border-parchment-400 bg-parchment-200 text-parchment-ink",
};

/** Small label chip. Always carries text, optionally an icon — never color alone. */
export function Badge({
  tone = "stone",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 text-xs font-bold uppercase tracking-[0.1em]",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
