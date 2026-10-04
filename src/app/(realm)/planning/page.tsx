import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { WeeklyPlanner } from "@/components/planning/WeeklyPlanner";
import { getDb } from "@/server/db/client";
import { getDiary } from "@/server/diaries/service";
import { loadBalanceView, loadCharacterSheet, loadCurrentBoss, loadDiary, loadPlanning, loadToday } from "@/server/queries";

export const metadata: Metadata = { title: "Weekly Planning" };

export default async function PlanningPage() {
  const [plan, sheet, boss, monthly, balance, today] = await Promise.all([
    loadPlanning(),
    loadCharacterSheet(),
    loadCurrentBoss(),
    loadDiary("MONTHLY"),
    loadBalanceView(),
    loadToday(),
  ]);
  const weekly = await getDiary(await getDb(), sheet.id, "WEEKLY", plan.weekStart);
  const horizon = new Date(Date.parse(`${plan.weekStart}T00:00:00Z`) + 21 * 86_400_000).toISOString().slice(0, 10);
  const roadAhead = plan.active
    .filter((q) => (q.deadline && q.deadline <= horizon) || (q.targetDate && q.targetDate <= horizon))
    .sort((a, b) => (a.deadline ?? a.targetDate ?? "").localeCompare(b.deadline ?? b.targetDate ?? ""));

  return (
    <>
      <PageBanner slot="planning" title="Weekly Planning" tagline="Prepare the week ahead like an expedition." />
      <WeeklyPlanner
        today={today}
        plan={plan}
        mainQuestCap={plan.inRecovery ? 1 : balance.mainQuestCap}
        hardCap={balance.mainQuestCap}
        roadAhead={roadAhead}
        boss={boss ? { id: boss.id, title: boss.title, hp: boss.hp, targetDate: boss.targetDate, deadline: boss.deadline } : null}
        monthly={{ label: monthly.period.label, done: monthly.entries.filter((e) => e.complete).length, total: monthly.entries.length, claimed: monthly.completedTiers }}
        weeklyDiary={{
          label: weekly.period.label,
          entries: weekly.entries.map((e) => ({ id: e.id, kind: e.kind, tier: e.tier, title: e.title, complete: e.complete })),
          claimedTiers: weekly.tiers.filter((t) => t.claimed).map((t) => t.tier),
        }}
      />
    </>
  );
}
