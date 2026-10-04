import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Adventure-toned empty state with at most one obvious next action. */
export function EmptyState({
  icon,
  title,
  message,
  action,
  tone = "dark",
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  message: ReactNode;
  action?: ReactNode;
  tone?: "dark" | "parchment";
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center gap-3 px-4 py-6 text-center", className)}>
      {icon}
      <p className={cx("q-title text-xl", tone === "dark" ? "text-gold-300" : "text-parchment-ink")}>{title}</p>
      <p className={cx("max-w-sm", tone === "dark" ? "text-text-secondary" : "text-parchment-ink-soft")}>{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
