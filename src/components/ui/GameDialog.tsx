"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Framed modal / drawer. Radix provides focus trapping, Escape to close,
 * scroll locking, and aria wiring. Use `placement="left"` for drawers.
 */
export function GameDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  placement = "center",
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: ReactNode;
  placement?: "center" | "left";
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-void/80 backdrop-blur-[2px] data-[state=open]:animate-[q-rise_var(--duration-base)_ease-out]" />
        <Dialog.Content
          className={cx(
            "fixed z-50 flex flex-col focus:outline-none",
            placement === "center"
              ? "q-stone q-frame-gold left-1/2 top-1/2 max-h-[85vh] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 p-6"
              : "q-timber inset-y-0 left-0 w-[min(86vw,20rem)] border-r-2 border-gold-700 shadow-deep data-[state=open]:animate-[q-rise_var(--duration-base)_var(--ease-game)]",
          )}
        >
          <Dialog.Title className={cx("q-display q-engraved text-lg", placement === "left" && "sr-only")}>
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1 text-sm text-text-secondary">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const GameDialogClose = Dialog.Close;
