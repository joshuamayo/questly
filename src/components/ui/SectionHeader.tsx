import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Banner-style section heading: display type, engraved gold on dark surfaces,
 * ink on parchment. Renders a real heading element for document outline.
 */
export function SectionHeader({
  id,
  title,
  eyebrow,
  level = 2,
  tone = "dark",
  action,
  className,
}: {
  id?: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  level?: 1 | 2 | 3;
  tone?: "dark" | "parchment";
  action?: ReactNode;
  className?: string;
}) {
  const Heading = `h${level}` as const;
  const size = level === 1 ? "text-display-lg" : level === 2 ? "text-xl" : "text-base";
  return (
    <div className={cx("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p
            className={cx(
              "mb-0.5 text-xs font-bold uppercase tracking-[0.18em]",
              tone === "dark" ? "text-teal-300" : "text-parchment-ink-soft",
            )}
          >
            {eyebrow}
          </p>
        )}
        <Heading
          id={id}
          className={cx("q-display", size, tone === "dark" ? "q-engraved" : "text-parchment-ink")}
        >
          {title}
        </Heading>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
