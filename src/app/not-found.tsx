import { GameLinkButton } from "@/components/ui/GameButton";
import { PixelIcon } from "@/components/icons/PixelIcon";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="q-parchment q-frame-gold max-w-md p-8 text-center">
        <PixelIcon name="world" size={48} className="mx-auto" />
        <h1 className="q-display mt-3 text-2xl">Uncharted Territory</h1>
        <p className="mt-2 text-parchment-ink-soft">There is nothing at this location. The page you followed does not exist.</p>
        <GameLinkButton href="/" variant="primary" className="mt-6">
          Return to World
        </GameLinkButton>
      </div>
    </div>
  );
}
