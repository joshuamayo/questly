"use client";

import { useEffect } from "react";
import { cx } from "@/lib/cx";

export type ToastState = { id: number; message: string; tone?: "success" | "error"; action?: { label: string; onClick: () => void } };

/**
 * A brief status message at the bottom of the screen, with an optional action
 * (e.g. Undo). Announced to assistive tech; dismisses itself.
 */
export function Toast({ toast, onDismiss, duration = 6000 }: { toast: ToastState | null; onDismiss: () => void; duration?: number }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [toast, onDismiss, duration]);

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-3 lg:bottom-6">
      {toast && (
        <div
          key={toast.id}
          className={cx(
            "q-stone q-frame q-enter pointer-events-auto flex max-w-lg items-center gap-3 px-4 py-3 text-sm",
            toast.tone === "error" ? "text-crimson-300" : "text-text-primary",
          )}
        >
          {toast.tone === "error" && <span aria-hidden>⚠</span>}
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="rounded-sm border border-gold-600 px-3 py-1 font-bold text-gold-200 hover:bg-gold-700/30"
              onClick={() => {
                toast.action!.onClick();
                onDismiss();
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" aria-label="Dismiss" className="px-1 text-text-muted hover:text-text-primary" onClick={onDismiss}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
