import { redirect } from "next/navigation";
import { ArtProvider } from "@/components/art/ArtContext";
import { ICON_ART_SLOTS } from "@/components/icons/art-slots";
import { BottomTabs } from "@/components/shell/BottomTabs";
import { MobileTopBar } from "@/components/shell/MobileTopBar";
import { SideRail } from "@/components/shell/SideRail";
import { MotionPreference } from "@/components/system/MotionPreference";
import { NoCharacterState } from "@/components/system/NoCharacterState";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { CharacterNotFoundError } from "@/game/errors";
import { artUrl } from "@/server/art";
import { NotSignedInError } from "@/server/auth/session";
import { loadProfile, type Profile } from "@/server/loaders";

/** The Questly shell: four-destination rail (desktop) or top bar + tabs (mobile). */
export default async function RealmLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile;
  try {
    profile = await loadProfile();
  } catch (error) {
    if (error instanceof CharacterNotFoundError) return <NoCharacterState />;
    if (error instanceof NotSignedInError) redirect("/login");
    throw error;
  }
  const bustUrl = artUrl("character/bust");
  const iconArt = Object.fromEntries(ICON_ART_SLOTS.map((slot) => [slot, artUrl(slot)]));

  return (
    <ArtProvider manifest={iconArt}>
      <TooltipProvider>
        <a href="#main" className="q-parchment fixed left-3 top-3 z-50 -translate-y-24 rounded-sm px-4 py-2 font-bold focus:translate-y-0">
          Skip to content
        </a>
        <MotionPreference motion={profile.settings.motion} />
        <div className="flex min-h-dvh" data-background={profile.settings.background}>
          <SideRail profile={profile} bustUrl={bustUrl} />
          <div className="relative flex min-w-0 flex-1 flex-col">
            <MobileTopBar profile={profile} bustUrl={bustUrl} />
            <main id="main" tabIndex={-1} className="flex-1 px-3 pb-24 pt-4 focus:outline-none sm:px-5 lg:px-6 lg:pb-10 lg:pt-0">
              {children}
            </main>
          </div>
        </div>
        <BottomTabs />
      </TooltipProvider>
    </ArtProvider>
  );
}
