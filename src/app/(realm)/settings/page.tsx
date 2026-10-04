import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { SettingsBoard } from "@/components/settings/SettingsBoard";
import { getSignedInUser } from "@/server/auth/session";
import { loadProfile } from "@/server/loaders";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [profile, user] = await Promise.all([loadProfile(), getSignedInUser()]);
  return (
    <>
      <PageBanner slot="settings" title="Settings" tagline="Customize your experience." />
      <SettingsBoard displayName={profile.displayName} avatar={profile.avatar} settings={profile.settings} signedInEmail={user?.email ?? null} />
    </>
  );
}
