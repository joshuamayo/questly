"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { GameDialog, GameDialogClose } from "@/components/ui/GameDialog";
import type { CharacterStatus } from "@/server/queries";
import { NavItem } from "./NavItem";
import { CHARACTER_NAV, PRIMARY_NAV, SETTINGS_NAV } from "./nav-config";
import { Wordmark } from "./Wordmark";

/** Navigation drawer for tablet/mobile. */
export function MobileMenu({ status }: { status: CharacterStatus }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <GameDialog
      open={open}
      onOpenChange={setOpen}
      title="Navigation"
      placement="left"
      trigger={
        <button
          type="button"
          className="q-well flex size-10 items-center justify-center border border-gold-700 text-gold-200"
          aria-label="Open navigation"
        >
          <span aria-hidden className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-gold-300" />
            <span className="block h-0.5 w-5 bg-gold-300" />
            <span className="block h-0.5 w-5 bg-gold-300" />
          </span>
        </button>
      }
    >
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <Wordmark compact />
        <GameDialogClose
          className="q-well flex size-9 items-center justify-center border border-border-dark text-text-secondary"
          aria-label="Close navigation"
        >
          <span aria-hidden>✕</span>
        </GameDialogClose>
      </div>
      <div className="q-rule mx-4" />
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-1">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <NavItem item={item} onNavigate={close} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="q-rule mx-4" />
      <nav aria-label="Account" className="flex flex-col gap-1 px-3 py-3">
        <NavItem item={{ ...CHARACTER_NAV, label: `${status.displayName} · Character` }} onNavigate={close} />
        <NavItem item={SETTINGS_NAV} onNavigate={close} />
      </nav>
      <p className="flex items-center gap-1.5 px-4 pb-4 text-xs text-text-muted">
        <PixelIcon name="lock" size={12} /> marks systems not yet built.
      </p>
    </GameDialog>
  );
}
