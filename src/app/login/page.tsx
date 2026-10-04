import type { Metadata } from "next";
import { WorldVista } from "@/components/art/WorldVista";
import { Wordmark } from "@/components/shell/Wordmark";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/server/auth/config";

export const metadata: Metadata = { title: "Sign In" };

const ERRORS: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Request a new one.",
  "not-allowed": "That account is not allowed into this realm.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? (ERRORS[params.error] ?? null) : null;
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center px-4 py-10">
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden opacity-60">
        <WorldVista />
      </div>
      <main id="main" className="q-stone q-frame-gold w-full max-w-md p-6 sm:p-8">
        <Wordmark />
        <h1 className="q-title mt-6 text-display-md leading-tight text-gold-300">Return to your adventure</h1>
        <p className="mt-2 text-text-secondary">Enter your email and we&apos;ll send a sign-in link. No password needed.</p>
        <LoginForm next={next} error={error} signedOut={params.signedOut === "1"} />
      </main>
    </div>
  );
}
