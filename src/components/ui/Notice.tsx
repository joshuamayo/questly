import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Inline message. `error` is announced to assistive tech. */
export function Notice({ tone = "info", children, className }: { tone?: "info" | "error" | "success"; children: ReactNode; className?: string }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "rounded-sm border px-3 py-2 text-sm",
        tone === "error" && "border-crimson-500 bg-crimson-700/30 text-crimson-300",
        tone === "success" && "border-moss-600 bg-moss-700/30 text-moss-300",
        tone === "info" && "border-blue-600 bg-blue-700/30 text-blue-300",
        className,
      )}
    >
      {tone === "error" && <span aria-hidden>⚠ </span>}
      {children}
    </p>
  );
}
