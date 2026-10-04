import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { SettingsBoard } from "@/components/settings/SettingsBoard";
import { FOCUS_XP, MAIN_QUEST_CAP, QUEST_REWARDS, BOSS_BOUNTY, RESPAWN_THRESHOLDS } from "@/game/config/balance";
import { loadBalanceView, loadCharacterSheet, loadSettingsView, loadToday } from "@/server/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [sheet, settings, balance, today] = await Promise.all([loadCharacterSheet(), loadSettingsView(), loadBalanceView(), loadToday()]);
  return (
    <>
      <PageBanner slot="settings" title="Settings" tagline="Shape how your adventure fits your life." />
      <SettingsBoard
        displayName={sheet.displayName}
        settings={settings}
        balance={balance}
        defaults={{
          questRewards: QUEST_REWARDS,
          mainQuestCap: MAIN_QUEST_CAP,
          focusDailyXpCap: FOCUS_XP.dailyXpCap,
          bounty: { ...BOSS_BOUNTY },
          respawn: { ...RESPAWN_THRESHOLDS },
        }}
        presets={[...FOCUS_XP.timerPresetsMinutes]}
        today={today}
      />
    </>
  );
}
