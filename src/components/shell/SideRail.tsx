import Link from "next/link";
import { AvatarSprite } from "@/components/character/AvatarSprite";
import type { CharacterStatus } from "@/server/queries";
import { NavItem } from "./NavItem";
import { CHARACTER_NAV, PRIMARY_NAV, SETTINGS_NAV } from "./nav-config";
import { Wordmark } from "./Wordmark";

/** Persistent desktop navigation rail. */
export function SideRail({ status }: { status: CharacterStatus }) {
  return (
    <aside className="q-timber sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-2 border-border-dark shadow-[inset_-1px_0_0_rgb(217_164_65/0.25)] lg:flex">
      <div className="px-4 pb-4 pt-5">
        <Wordmark />
      </div>
      <div className="q-rule mx-4" />
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-1">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <NavItem item={item} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="q-rule mx-4" />
      <nav aria-label="Account" className="flex flex-col gap-1 px-3 py-3">
        <Link
          href={CHARACTER_NAV.href}
          className="q-well flex items-center gap-3 border border-border-dark px-2 py-2 hover:border-gold-700"
        >
          <span className="flex size-11 items-end justify-center overflow-hidden rounded-xs bg-stone-850">
            <AvatarSprite avatar={status.avatar} name={status.displayName} height={40} />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-bold text-text-primary">{status.displayName}</span>
            <span className="block truncate text-xs text-gold-300">{status.title?.name ?? "No title equipped"}</span>
            <span className="block text-xs text-text-muted">Character</span>
          </span>
        </Link>
        <NavItem item={SETTINGS_NAV} />
      </nav>
    </aside>
  );
}
