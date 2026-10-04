import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { DiaryBoard } from "@/components/meta/DiaryBoard";
import { daysRemaining } from "@/game/diaries";

import { loadDiary, loadToday } from "@/server/queries";

export const metadata: Metadata = { title: "Achievement Diaries" };

export default async function DiariesPage() {
  const [weekly, monthly] = await Promise.all([loadDiary("WEEKLY"), loadDiary("MONTHLY")]);
  const today = await loadToday();
  return (
    <>
      <PageBanner slot="achievement-diaries" title="Achievement Diaries" tagline="Complete diaries, earn rewards, and track your long-term consistency." />
      <DiaryBoard weekly={weekly} monthly={monthly} daysLeft={{ WEEKLY: daysRemaining(weekly.period, today), MONTHLY: daysRemaining(monthly.period, today) }} />
    </>
  );
}
