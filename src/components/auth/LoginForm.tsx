"use client";

import { useActionState } from "react";
import { sendSignInLink, type LoginState } from "@/app/login/actions";
import { GameButton } from "@/components/ui/GameButton";
import { Notice } from "@/components/ui/Notice";

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2.5 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

export function LoginForm({ next, error, signedOut }: { next: string; error: string | null; signedOut: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendSignInLink, { status: "idle" });
  return (
    <form action={action} className="mt-5 flex flex-col gap-3">
      {signedOut && state.status === "idle" && <Notice tone="success">You have signed out. Your progress is safe.</Notice>}
      {error && state.status === "idle" && <Notice tone="error">{error}</Notice>}
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Email
        <input className={field} type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <GameButton type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send Sign-In Link"}
      </GameButton>
      {state.status === "sent" && <Notice tone="success">{state.message}</Notice>}
      {state.status === "error" && <Notice tone="error">{state.message}</Notice>}
    </form>
  );
}
