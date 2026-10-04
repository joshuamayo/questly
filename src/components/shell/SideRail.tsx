import type { CharacterSheet } from "@/server/queries/character-sheet";
import { CharacterCard } from "./CharacterCard";
import { NavItem } from "./NavItem";
import { PRIMARY_NAV, SETTINGS_NAV } from "./nav-config";
import { Wordmark } from "./Wordmark";

/** Persistent desktop navigation rail. */
export function SideRail({ sheet, characterArtUrl }: { sheet: CharacterSheet; characterArtUrl: string | null }) {
  return (
    <aside className="q-rail sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border-dark shadow-[inset_-1px_0_0_var(--color-bronze),inset_-2px_0_0_rgb(0_0_0/0.6)] lg:flex">
      <div className="px-4 pb-3 pt-4">
        <Wordmark />
      </div>
      <div className="q-rule mx-4" />
      <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
        <ul className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <NavItem item={item} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-col gap-1.5 px-2.5 pb-3">
        <CharacterCard sheet={sheet} fullUrl={characterArtUrl} />
        <nav aria-label="Account">
          <NavItem item={SETTINGS_NAV} />
        </nav>
      </div>
    </aside>
  );
}
