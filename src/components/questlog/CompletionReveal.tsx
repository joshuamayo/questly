"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { GameButton } from "@/components/ui/GameButton";
import { formatNumber } from "@/lib/format";

export type CompletionPayload = {
  quest: { title: string };
  gpEarned: number;
  gpBalance: number;
  next: { title: string } | null;
};

/**
 * Quest Complete! The one celebration in Questly: the quest, the GP earned,
 * and what's next. Fast and skippable (Escape or Continue); the coin pop and
 * glow respect reduced motion.
 */
export function CompletionReveal({ payload, onClose }: { payload: CompletionPayload | null; onClose: () => void }) {
  return (
    <Dialog.Root open={Boolean(payload)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-void/85 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="reveal-desc"
          className="fixed left-1/2 top-1/2 z-50 flex w-[min(94vw,30rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 focus:outline-none"
        >
          {payload && (
            <>
              <div className="q-parchment q-frame-gold q-enter w-full px-6 py-5 text-center">
                <Dialog.Title className="q-title text-display-lg leading-none text-parchment-ink">Quest Complete!</Dialog.Title>
                <p className="q-title mt-2 text-xl text-parchment-ink">{payload.quest.title}</p>
              </div>
              <div aria-hidden className="q-coin-pop relative flex h-36 w-48 items-end justify-center">
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgb(235_196_106/0.55),transparent)]" />
                <PixelIcon name="gp" size={64} className="relative -mr-5 mb-1" />
                <PixelIcon name="gp" size={88} className="relative z-10" />
                <PixelIcon name="gp" size={64} className="relative -ml-5 mb-1" />
              </div>
              <p className="q-stone q-frame-gold q-title -mt-2 px-6 py-2 text-display-md text-gold-200">
                {payload.gpEarned > 0 ? `+${formatNumber(payload.gpEarned)} GP` : "Done!"}
              </p>
              <p id="reveal-desc" className="text-center text-text-secondary [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
                {payload.next ? (
                  <>
                    Up next: <span className="font-bold text-text-primary">{payload.next.title}</span>
                  </>
                ) : (
                  "Your Quest Log is clear. Every quest done."
                )}
                <span className="block text-sm">You now have {formatNumber(payload.gpBalance)} GP.</span>
              </p>
              <Dialog.Close asChild>
                <GameButton variant="success" size="lg" className="min-w-64" autoFocus>
                  {payload.next ? "Continue to Next Quest →" : "Back to Quest Log"}
                </GameButton>
              </Dialog.Close>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
