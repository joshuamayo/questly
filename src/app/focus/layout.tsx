import Link from "next/link";
import { ArtProvider } from "@/components/art/ArtContext";
import { ICON_ART_SLOTS } from "@/components/icons/art-slots";
import { StatusBar } from "@/components/shell/StatusBar";
import { Wordmark } from "@/components/shell/Wordmark";
import { NoCharacterState } from "@/components/system/NoCharacterState";
import { CharacterNotFoundError } from "@/game/errors";
import { redirect } from "next/navigation";
import { NotSignedInError } from "@/server/auth/session";
import { artUrl } from "@/server/art";
import { loadCharacterSheet, loadSettingsView, toCharacterStatus, type CharacterSheet } from "@/server/queries";
import { MotionPreference } from "@/components/system/MotionPreference";
import { TimezoneSync } from "@/components/system/TimezoneSync";

/**
 * Focus Mode shell: navigation is minimized to an exit, so one Quest and one
 * Current Step can dominate (CLAUDE.md §13).
 */
export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  let sheet: CharacterSheet;
  try {
    sheet = await loadCharacterSheet();
  } catch (error) {
    if (error instanceof CharacterNotFoundError) return <NoCharacterState />;
    if (error instanceof NotSignedInError) redirect("/login");
    throw error;
  }
  const iconArt = Object.fromEntries(ICON_ART_SLOTS.map((slot) => [slot, artUrl(slot)]));
  const settings = await loadSettingsView();
  return (
    <ArtProvider manifest={iconArt}>
      <TimezoneSync />
      <MotionPreference motion={settings.motion} />
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center gap-3 border-b border-border-dark px-3 py-2 shadow-[inset_0_-1px_0_var(--color-bronze)] sm:px-6">
          <Wordmark compact />
          <span className="hidden text-sm uppercase tracking-[0.2em] text-text-muted sm:inline">Focus Mode</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:block">
              <StatusBar status={toCharacterStatus(sheet)} bustUrl={artUrl("character/bust")} />
            </div>
            <Link href="/" className="rounded-sm border border-stone-600 px-3 py-2 text-sm text-text-secondary hover:border-gold-500 hover:text-gold-200">
              Exit Focus Mode
            </Link>
          </div>
        </header>
        <main id="main" className="flex-1 px-3 py-5 sm:px-6">
          {children}
        </main>
      </div>
    </ArtProvider>
  );
}
