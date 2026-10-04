import type { CharacterStatus } from "@/server/queries/character-sheet";
import { MobileMenu } from "./MobileMenu";
import { StatusBar } from "./StatusBar";
import { Wordmark } from "./Wordmark";

/** Compact top bar below the desktop breakpoint: menu, wordmark, status. */
export function MobileTopBar({ status, bustUrl }: { status: CharacterStatus; bustUrl: string | null }) {
  return (
    <header className="q-rail sticky top-0 z-30 flex min-h-14 items-center gap-2 overflow-x-clip border-b border-border-dark px-3 shadow-[inset_0_-1px_0_var(--color-bronze),0_6px_16px_rgb(0_0_0/0.45)] sm:px-5 lg:hidden">
      <MobileMenu status={status} />
      <span className="hidden sm:block">
        <Wordmark compact />
      </span>
      <div className="ml-auto">
        <StatusBar status={status} bustUrl={bustUrl} />
      </div>
    </header>
  );
}
