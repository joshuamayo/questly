import { AccountStrip } from "@/components/shell/AccountStrip";
import { BottomTabs } from "@/components/shell/BottomTabs";
import { SideRail } from "@/components/shell/SideRail";
import { NoCharacterState } from "@/components/system/NoCharacterState";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { CharacterNotFoundError } from "@/game/errors";
import { loadCharacterStatus, type CharacterStatus } from "@/server/queries";

/** The persistent Questly shell: rail + account strip around every realm screen. */
export default async function RealmLayout({ children }: { children: React.ReactNode }) {
  let status: CharacterStatus;
  try {
    status = await loadCharacterStatus();
  } catch (error) {
    if (error instanceof CharacterNotFoundError) return <NoCharacterState />;
    throw error;
  }

  return (
    <TooltipProvider>
      <a
        href="#main"
        className="q-parchment fixed left-3 top-3 z-50 -translate-y-24 rounded-sm px-4 py-2 font-bold focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <SideRail status={status} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AccountStrip status={status} />
          <main id="main" tabIndex={-1} className="flex-1 px-3 pb-24 pt-4 focus:outline-none sm:px-5 sm:pb-10 lg:px-8 lg:pt-6">
            {children}
          </main>
        </div>
      </div>
      <BottomTabs />
    </TooltipProvider>
  );
}
