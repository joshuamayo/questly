import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Panel / section heading: optional icon, gold serif title, optional eyebrow
 * and trailing action. Renders a real heading element for document outline.
 */
export function SectionHeader({
  id,
  title,
  eyebrow,
  icon,
  level = 2,
  tone = "dark",
  action,
  divider = false,
  className,
}: {
  id?: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  icon?: ReactNode;
  level?: 1 | 2 | 3;
  tone?: "dark" | "parchment";
  action?: ReactNode;
  divider?: boolean;
  className?: string;
}) {
  const Heading = `h${level}` as const;
  const size = level === 1 ? "text-display-lg" : level === 2 ? "text-xl" : "text-lg";
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-3",
        divider && (tone === "dark" ? "border-b border-stone-700 pb-2.5" : "border-b border-parchment-400/60 pb-2.5"),
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="min-w-0">
          {eyebrow && (
            <p
              className={cx(
                "text-xs font-bold uppercase tracking-[0.16em]",
                tone === "dark" ? "text-blue-300" : "text-parchment-ink-soft",
              )}
            >
              {eyebrow}
            </p>
          )}
          <Heading
            id={id}
            className={cx("q-title leading-tight", size, tone === "dark" ? "text-gold-300" : "text-parchment-ink")}
          >
            {title}
          </Heading>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
