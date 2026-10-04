import { MobileTopBar } from "@/components/shell/MobileTopBar";
import { BottomTabs } from "@/components/shell/BottomTabs";
import { SideRail } from "@/components/shell/SideRail";
import { StatusBar } from "@/components/shell/StatusBar";
import { NoCharacterState } from "@/components/system/NoCharacterState";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { TimezoneSync } from "@/components/system/TimezoneSync";
import { MotionPreference } from "@/components/system/MotionPreference";
import { CharacterNotFoundError } from "@/game/errors";
import { ArtProvider } from "@/components/art/ArtContext";
import { ICON_ART_SLOTS } from "@/components/icons/art-slots";
import { artUrl } from "@/server/art";
import { loadCharacterSheet, loadSettingsView, toCharacterStatus, type CharacterSheet } from "@/server/queries";

/** The persistent Questly shell: rail + status bar around every realm screen. */
export default async function RealmLayout({ children }: { children: React.ReactNode }) {
  let sheet: CharacterSheet;
  try {
    sheet = await loadCharacterSheet();
  } catch (error) {
    if (error instanceof CharacterNotFoundError) return <NoCharacterState />;
    throw error;
  }
  const status = toCharacterStatus(sheet);
  const bustUrl = artUrl("character/bust");

  const settings = await loadSettingsView();
  const iconArt = Object.fromEntries(ICON_ART_SLOTS.map((slot) => [slot, artUrl(slot)]));

  return (
    <ArtProvider manifest={iconArt}>
    <TooltipProvider>
      <a
        href="#main"
        className="q-parchment fixed left-3 top-3 z-50 -translate-y-24 rounded-sm px-4 py-2 font-bold focus:translate-y-0"
      >
        Skip to content
      </a>
      <TimezoneSync />
      <MotionPreference motion={settings.motion} />
      <div className="flex min-h-dvh">
        <SideRail sheet={sheet} characterArtUrl={artUrl("character/full")} />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <MobileTopBar status={status} bustUrl={bustUrl} />
          <div className="absolute right-6 top-4 z-20 hidden lg:block">
            <StatusBar status={status} bustUrl={bustUrl} />
          </div>
          <main id="main" tabIndex={-1} className="flex-1 px-3 pb-24 pt-4 focus:outline-none sm:px-5 sm:pb-10 lg:px-6 lg:pt-0">
            {children}
          </main>
        </div>
      </div>
      <BottomTabs />
    </TooltipProvider>
    </ArtProvider>
  );
}
