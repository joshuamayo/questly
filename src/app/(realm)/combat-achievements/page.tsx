import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/art/PageBanner";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { TierBadge, TierShield, TIER_LABELS, tierColor } from "@/components/meta/TierBadge";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { COMBAT_ACHIEVEMENT_TIERS } from "@/game/vocabulary";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { loadCharacterSheet, loadCombatAchievements } from "@/server/queries";

export const metadata: Metadata = { title: "Combat Achievements" };

export default async function CombatAchievementsPage({ searchParams }: PageProps<"/combat-achievements">) {
  const [params, list, sheet] = await Promise.all([searchParams, loadCombatAchievements(), loadCharacterSheet()]);
  const tierParam = typeof params.tier === "string" ? params.tier.toUpperCase() : "ALL";
  const tier = (COMBAT_ACHIEVEMENT_TIERS as readonly string[]).includes(tierParam) ? tierParam : "ALL";
  const shown = tier === "ALL" ? list : list.filter((a) => a.tier === tier);
  const completed = list.filter((a) => a.completedAt);
  const maxCp = list.reduce((s, a) => s + a.combatPoints, 0);
  const nearest = list
    .filter((a) => !a.completedAt && a.progress.percent > 0)
    .sort((a, b) => b.progress.percent - a.progress.percent)
    .slice(0, 4);
  const recent = [...completed].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")).slice(0, 5);

  return (
    <>
      <PageBanner slot="combat-achievements" title="Combat Achievements" tagline="Push your limits. Prove your consistency. Earn permanent Combat Points." />

      <nav aria-label="Tiers" className="q-stone q-frame mb-4 flex flex-wrap gap-1.5 p-1.5">
        {["ALL", ...COMBAT_ACHIEVEMENT_TIERS].map((t) => {
          const items = t === "ALL" ? list : list.filter((a) => a.tier === t);
          const done = items.filter((a) => a.completedAt).length;
          return (
            <Link
              key={t}
              href={t === "ALL" ? "/combat-achievements" : `/combat-achievements?tier=${t.toLowerCase()}`}
              aria-current={tier === t ? "page" : undefined}
              className={cx(
                "flex min-h-11 items-center gap-2 rounded-sm border px-3",
                tier === t ? "border-gold-500 bg-gold-700/25 text-gold-100" : "border-stone-700 text-text-primary hover:border-stone-500",
              )}
            >
              {t === "ALL" ? <PixelIcon name="combat" size={20} /> : <TierShield tier={t} />}
              <span>{t === "ALL" ? "All" : TIER_LABELS[t]}</span>
              <span className="text-xs tabular-nums text-text-muted">
                {done}/{items.length}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-4">
          <GamePanel as="section" surface="parchment" labelledBy="ca-progress" className="p-5">
            <div className="grid gap-5 md:grid-cols-[13rem_1fr]">
              <div className="flex flex-col items-center justify-center text-center">
                <SectionHeader id="ca-progress" tone="parchment" title="Combat Progress" level={2} />
                <div className="mt-3 flex size-40 flex-col items-center justify-center rounded-full border-8 border-parchment-ink bg-stone-900 shadow-[inset_0_0_20px_rgb(0_0_0/0.8)]">
                  <PixelIcon name="combat-points" size={32} />
                  <span className="q-title text-4xl leading-none text-text-primary">{formatNumber(sheet.combatPoints)}</span>
                  <span className="text-xs text-text-secondary">/ {formatNumber(maxCp)} Combat Points</span>
                </div>
                <p className="mt-2 text-sm font-bold text-parchment-ink">
                  {completed.length} / {list.length} achievements
                </p>
              </div>
              <div>
                <p className="q-title text-xl text-parchment-ink">Tier Progress</p>
                <ul className="mt-2 flex flex-col gap-2.5">
                  {COMBAT_ACHIEVEMENT_TIERS.map((t) => {
                    const items = list.filter((a) => a.tier === t);
                    const done = items.filter((a) => a.completedAt).length;
                    return (
                      <li key={t} className="grid grid-cols-[8rem_1fr_3.5rem] items-center gap-3">
                        <span className="flex items-center gap-2 font-bold text-parchment-ink">
                          <TierShield tier={t} /> {TIER_LABELS[t]}
                        </span>
                        <ProgressBar color={tierColor(t)} value={(done / items.length) * 100} label={`${TIER_LABELS[t]} tier`} valueText={`${done} of ${items.length}`} />
                        <span className="text-right text-sm font-bold tabular-nums text-parchment-ink">
                          {done} / {items.length}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </GamePanel>

          <GamePanel as="section" labelledBy="ca-log" className="p-4">
            <SectionHeader id="ca-log" icon={<PixelIcon name="diaries" size={22} />} title="Challenge Log" divider action={<span className="text-sm text-text-secondary">{shown.length} challenges</span>} />
            <ul className="mt-2">
              {shown.map((a) => {
                const status = a.completedAt ? "Completed" : a.progress.current > 0 ? "In Progress" : "Not Started";
                return (
                  <li key={a.key} className="grid gap-x-4 gap-y-1 border-b border-stone-800 py-3 last:border-0 md:grid-cols-[minmax(0,1.6fr)_7rem_minmax(0,1fr)_4.5rem_7.5rem] md:items-center">
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary">{a.title}</p>
                      <p className="text-sm text-text-secondary">{a.description}</p>
                    </div>
                    <TierBadge tier={a.tier} className="w-fit" />
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        size="sm"
                        className="flex-1"
                        color={tierColor(a.tier)}
                        value={a.progress.percent}
                        label={`${a.title} progress`}
                        valueText={`${formatNumber(a.progress.current)} of ${formatNumber(a.progress.target)}`}
                      />
                      <span className="w-20 text-right text-xs tabular-nums text-text-secondary">
                        {formatNumber(a.progress.current)}/{formatNumber(a.progress.target)}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-text-primary">
                      <PixelIcon name="combat-points" size={14} />+{a.combatPoints}
                    </span>
                    <span className={cx("flex items-center gap-1.5 text-sm", a.completedAt ? "text-moss-300" : "text-text-muted")}>
                      <span aria-hidden>{a.completedAt ? "✓" : "○"}</span>
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </GamePanel>
        </div>

        <div className="flex flex-col gap-4">
          <GamePanel as="section" labelledBy="ca-near" className="p-4">
            <SectionHeader id="ca-near" icon={<PixelIcon name="total-level" size={22} />} title="Within Reach" divider />
            {nearest.length === 0 ? (
              <p className="mt-3 text-sm text-text-secondary">Complete Quests, Focus sessions, and Bosses — challenges track themselves.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3">
                {nearest.map((a) => (
                  <li key={a.key}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-text-primary">{a.title}</span>
                      <TierBadge tier={a.tier} />
                    </div>
                    <p className="text-sm text-text-secondary">{a.description}</p>
                    <ProgressBar className="mt-1" size="sm" color={tierColor(a.tier)} value={a.progress.percent} label={`${a.title} progress`} valueText={`${a.progress.current} of ${a.progress.target}`} />
                  </li>
                ))}
              </ul>
            )}
          </GamePanel>
          <GamePanel as="section" labelledBy="ca-recent" className="p-4">
            <SectionHeader id="ca-recent" icon={<PixelIcon name="combat-points" size={22} />} title="Recent Combat Points" divider />
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-text-secondary">No Combat Achievements completed yet.</p>
            ) : (
              <ul className="mt-2">
                {recent.map((a) => (
                  <li key={a.key} className="flex items-center gap-2 border-b border-stone-800 py-2 last:border-0">
                    <TierShield tier={a.tier} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-text-primary">{a.title}</span>
                      <span className="text-xs text-text-muted">{a.completedAt && <LocalDate iso={a.completedAt} options={{ month: "short", day: "numeric" }} />}</span>
                    </span>
                    <span className="font-bold text-gold-200">+{a.combatPoints}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-text-muted">Combat Points are permanent and cannot be spent.</p>
          </GamePanel>
        </div>
      </div>
    </>
  );
}
