"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RadixTooltip.Provider delayDuration={250}>{children}</RadixTooltip.Provider>;
}

/**
 * Supplementary hint on hover/focus. Never put essential information only in
 * a tooltip; the trigger must be focusable (Radix handles keyboard + ARIA).
 */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          sideOffset={6}
          className="q-parchment z-50 max-w-xs rounded-sm border-2 border-timber-800 px-3 py-2 text-sm shadow-raised"
        >
          {content}
          <RadixTooltip.Arrow className="fill-timber-800" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
