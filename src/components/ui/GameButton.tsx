import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "q-display inline-flex items-center justify-center gap-2 uppercase select-none border-2 rounded-sm " +
  "transition-[transform,filter,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-game)] " +
  "active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border-gold-700 text-timber-950 shadow-raised hover:brightness-110 " +
    "bg-[linear-gradient(180deg,var(--color-gold-200),var(--color-gold-400)_55%,var(--color-gold-500))] " +
    "[box-shadow:inset_0_1px_0_var(--color-gold-100),inset_0_-2px_0_var(--color-gold-600),var(--shadow-raised)]",
  secondary:
    "q-stone border-border-dark text-gold-200 shadow-bevel hover:text-gold-100 hover:brightness-125 " +
    "[box-shadow:inset_0_0_0_1px_rgb(217_164_65/0.35),var(--shadow-bevel),var(--shadow-raised)]",
  ghost: "border-transparent text-gold-300 hover:text-gold-100 hover:bg-stone-800/60",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3 text-xs tracking-[0.12em]",
  md: "min-h-11 px-5 text-sm tracking-[0.14em]",
  lg: "min-h-13 px-7 text-base tracking-[0.16em]",
};

type Common = { variant?: Variant; size?: Size; icon?: ReactNode; className?: string; children: ReactNode };

export function GameButton({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: Common & Omit<ComponentProps<"button">, "children">) {
  return (
    <button type="button" className={cx(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

/** A navigation action styled as a game button. Only for real destinations. */
export function GameLinkButton({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, "children">) {
  return (
    <Link className={cx(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}
