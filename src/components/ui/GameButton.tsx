import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "q-title inline-flex items-center justify-center gap-2 select-none border rounded-sm " +
  "transition-[transform,filter,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-game)] " +
  "active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border-gold-700 text-timber-950 hover:brightness-110 " +
    "bg-[linear-gradient(180deg,var(--color-gold-200),var(--color-gold-400)_45%,var(--color-gold-500))] " +
    "[box-shadow:inset_0_0_0_1px_var(--color-gold-100),inset_0_-3px_0_var(--color-gold-600),0_0_0_1px_var(--color-border-dark),var(--shadow-raised)]",
  secondary:
    "border-blue-600 bg-stone-850 text-text-primary hover:border-blue-400 hover:bg-stone-800 " +
    "[box-shadow:inset_0_1px_0_rgb(255_255_255/0.05),var(--shadow-raised)]",
  ghost: "border-transparent text-blue-300 hover:text-blue-300 hover:underline underline-offset-4",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-5 text-base",
  lg: "min-h-13 px-7 text-lg",
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
