import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { QuestLogBoard } from "@/components/questlog/QuestLogBoard";
import { loadProfile, loadQuestLog } from "@/server/loaders";

export const metadata: Metadata = { title: "Quest Log" };

export default async function QuestLogPage() {
  const [profile, log] = await Promise.all([loadProfile(), loadQuestLog()]);
  const s = profile.settings;
  return (
    <>
      <PageBanner slot="quest-log" title="Your Adventure" tagline="One quest at a time. Real progress. Real rewards." />
      <QuestLogBoard
        log={log}
        gpBalance={profile.gpBalance}
        settings={{
          defaultQuestGp: s.defaultQuestGp,
          confirmCompletion: s.confirmCompletion,
          celebrateCompletions: s.celebrateCompletions,
          sound: s.sound,
          showSavingsGoal: s.showSavingsGoal,
          showRecentCompletions: s.showRecentCompletions,
        }}
      />
    </>
  );
}
