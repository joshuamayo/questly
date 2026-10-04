"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addPlanDiaryEntryAction, confirmPlanAction, removePlanDiaryEntryAction, setPlanItemAction } from "@/app/(realm)/planning/actions";
import { setQuestPriorityAction } from "@/app/(realm)/quests/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { TierShield } from "@/components/meta/TierBadge";
import { DifficultyBadge } from "@/components/quests/DifficultyBadge";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameButton, GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DIARY_TIER_LABELS } from "@/game/diaries";
import { WEEKDAY_NAMES, weekdayOf } from "@/game/planning";
import { DIARY_TIERS, type DiaryTier } from "@/game/vocabulary";
import { cx } from "@/lib/cx";
import { formatIsoDate } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { useAction } from "@/lib/use-action";
import type { PlanningView } from "@/server/planning/service";
import type { QuestSummary } from "@/server/queries";

const STEPS: { key: string; title: string; icon: SpriteName }[] = [
  { key: "recap", title: "Previous Week", icon: "diaries" },
  { key: "road", title: "The Road Ahead", icon: "world" },
  { key: "battles", title: "Choose Battles", icon: "combat" },
  { key: "diary", title: "Weekly Diary", icon: "diaries" },
  { key: "allocate", title: "Rough Allocation", icon: "questlines" },
  { key: "begin", title: "Begin Adventure", icon: "quests" },
];

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

type Props = {
  today: string;
  plan: PlanningView;
  mainQuestCap: number;
  hardCap: number;
  roadAhead: QuestSummary[];
  boss: { id: string; title: string; hp: number; targetDate: string | null; deadline: string | null } | null;
  monthly: { label: string; done: number; total: number; claimed: number };
  weeklyDiary: { label: string; entries: { id: string; kind: "AUTO" | "CUSTOM"; tier: DiaryTier; title: string; complete: boolean }[]; claimedTiers: DiaryTier[] };
};

export function WeeklyPlanner(props: Props) {
  const { plan } = props;
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const go = (i: number) => {
    setStep(i);
    requestAnimationFrame(() => headingRef.current?.focus());
  };
  const s = STEPS[step];
  const weekLabel = `${formatIsoDate(plan.days[0], { month: "short", day: "numeric" })} – ${formatIsoDate(plan.days[6], { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <GamePanel as="nav" aria-label="Planning steps" className="p-3">
        <p className="px-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-300">Week of</p>
        <p className="q-title px-2 text-lg text-gold-200">{weekLabel}</p>
        {plan.confirmed && (
          <Badge tone="moss" className="mx-2 mt-1">
            ✓ Adventure begun
          </Badge>
        )}
        <ol className="mt-3 flex gap-1 overflow-x-auto lg:flex-col">
          {STEPS.map((st, i) => (
            <li key={st.key} className="shrink-0">
              <button
                type="button"
                aria-current={i === step ? "step" : undefined}
                onClick={() => go(i)}
                className={cx(
                  "flex min-h-10 w-full items-center gap-2 rounded-sm border px-2 text-left text-sm",
                  i === step ? "border-gold-500 bg-gold-700/25 text-gold-100" : "border-transparent text-text-secondary hover:border-stone-600",
                )}
              >
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-stone-500 text-xs">{i < step ? "✓" : i + 1}</span>
                <span className="hidden sm:inline">{st.title}</span>
                <span className="sr-only sm:hidden">{st.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </GamePanel>

      <GamePanel as="section" aria-labelledby="planning-step" className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <PixelIcon name={s.icon} size={26} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 id="planning-step" ref={headingRef} tabIndex={-1} className="q-title text-display-md leading-tight text-gold-300 focus:outline-none">
              {s.title}
            </h2>
          </div>
        </div>

        {s.key === "recap" && <Recap plan={plan} />}
        {s.key === "road" && <RoadAhead {...props} />}
        {s.key === "battles" && <Battles {...props} />}
        {s.key === "diary" && <DiaryStep {...props} />}
        {s.key === "allocate" && <Allocate {...props} />}
        {s.key === "begin" && <Begin {...props} />}

        <div className="mt-2 flex justify-between gap-2 border-t border-stone-700 pt-4">
          <GameButton disabled={step === 0} onClick={() => go(step - 1)}>
            ← Back
          </GameButton>
          {step < STEPS.length - 1 && (
            <GameButton variant="primary" onClick={() => go(step + 1)}>
              Next: {STEPS[step + 1].title} →
            </GameButton>
          )}
        </div>
      </GamePanel>
    </div>
  );
}

function Recap({ plan }: { plan: PlanningView }) {
  const r = plan.recap;
  const quiet = r.quests.length === 0 && r.xp === 0 && r.focusMinutes === 0;
  const tiles = [
    { label: "Quests completed", value: r.quests.length, icon: "quests" as const },
    { label: "XP earned", value: r.xp, icon: "total-level" as const },
    { label: "GP earned", value: r.gp, icon: "gp" as const },
    { label: "Quest Points", value: r.qp, icon: "qp" as const },
    { label: "Focus minutes", value: r.focusMinutes, icon: "skill-focus" as const },
    { label: "Diary tiers", value: r.diaryTiers, icon: "diaries" as const },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-secondary">
        Week of {formatIsoDate(r.start, { month: "short", day: "numeric" })}. {quiet ? "Last week was quiet — every week is a fresh start." : "Here is what you brought home."}
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((t) => (
          <li key={t.label} className="q-well flex items-center gap-3 border border-border-dark p-3">
            <PixelIcon name={t.icon} size={28} />
            <span>
              <span className="q-title block text-2xl tabular-nums text-gold-200">{formatNumber(t.value)}</span>
              <span className="text-xs text-text-muted">{t.label}</span>
            </span>
          </li>
        ))}
      </ul>
      {r.quests.length > 0 && (
        <ul className="flex flex-col gap-1">
          {r.quests.map((q) => (
            <li key={q.id}>
              <Link href={`/quests/${q.id}`} className="text-text-primary hover:underline">
                ✓ {q.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoadAhead({ roadAhead, boss, monthly }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="flex flex-col gap-2">
        <h3 className="q-title text-lg text-gold-300">Real deadlines &amp; targets</h3>
        {roadAhead.length === 0 ? (
          <p className="text-text-secondary">No deadlines or targets in the next three weeks. The road is open.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {roadAhead.map((q) => (
              <li key={q.id} className="flex items-center gap-3 rounded-sm border border-stone-700 px-3 py-2">
                <SkillIcon icon={q.icon} size={24} />
                <span className="min-w-0 flex-1">
                  <Link href={`/quests/${q.id}`} className="block truncate text-text-primary hover:underline">
                    {q.title}
                  </Link>
                  <span className="text-xs text-text-muted">
                    {q.deadline ? `Hard deadline ${formatIsoDate(q.deadline)}` : `Target ${formatIsoDate(q.targetDate!)}`}
                  </span>
                </span>
                {q.priority === "MAIN" && <Badge tone="gold">Main</Badge>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="rounded-sm border border-crimson-500/60 p-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-crimson-300">
            <PixelIcon name="bosses" size={16} /> Current Boss
          </p>
          {boss ? (
            <>
              <Link href={`/quests/${boss.id}`} className="q-title mt-1 block text-xl text-text-primary hover:underline">
                {boss.title}
              </Link>
              <ProgressBar className="mt-2" tone="crimson" value={boss.hp} label="Boss HP" valueText={`${boss.hp}% HP remaining`} />
              <p className="mt-1 text-xs text-text-muted">{boss.hp}% HP remaining</p>
            </>
          ) : (
            <p className="mt-1 text-text-secondary">No foe currently stands between you and your biggest goal.</p>
          )}
        </div>
        <div className="rounded-sm border border-stone-700 p-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-300">
            <PixelIcon name="diaries" size={16} /> Monthly Diary — {monthly.label}
          </p>
          <ProgressBar className="mt-2" tone="moss" value={monthly.total ? (monthly.done / monthly.total) * 100 : 0} label="Monthly Diary progress" valueText={`${monthly.done} of ${monthly.total}`} />
          <p className="mt-1 text-xs text-text-muted">
            {monthly.done} / {monthly.total} entries · {monthly.claimed} of 4 tiers claimed
          </p>
        </div>
      </div>
    </div>
  );
}

function Battles({ plan, mainQuestCap, hardCap }: Props) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const candidates = plan.active.filter((q) => q.status !== "ON_HOLD");
  const mains = plan.active.filter((q) => q.priority === "MAIN").length;
  if (plan.active.length === 0) {
    return (
      <EmptyState
        icon={<PixelIcon name="quests" size={44} />}
        title="Your Quest Journal is empty."
        message="Every adventure starts somewhere."
        action={
          <GameLinkButton href="/quests/board" variant="primary">
            Find a Quest
          </GameLinkButton>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-secondary">
        Choose up to {mainQuestCap} Main Quest{mainQuestCap === 1 ? "" : "s"} for this week ({mains} chosen). Everything else stays a Side Quest — still there, just quieter.
      </p>
      {plan.inRecovery && <Notice>Recovery week: one Main Quest is plenty. Build momentum before taking on more.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <ul className="flex flex-col gap-2">
        {candidates.map((q) => {
          const main = q.priority === "MAIN";
          const blocked = !main && mains >= hardCap;
          return (
            <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-stone-700 px-3 py-2">
              <SkillIcon icon={q.icon} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-text-primary">{q.title}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <DifficultyBadge difficulty={q.difficulty} />
                  {q.progress.total > 0 && `${q.progress.done}/${q.progress.total} objectives`}
                  {q.isBoss && <Badge tone="crimson">Boss</Badge>}
                </span>
              </span>
              <button
                type="button"
                aria-pressed={main}
                disabled={pending || blocked}
                title={blocked ? `All ${hardCap} Main Quest slots are taken.` : undefined}
                onClick={() => run(() => setQuestPriorityAction(q.id, main ? "SIDE" : "MAIN"), () => router.refresh())}
                className={cx(
                  "min-h-10 rounded-sm border px-3 text-sm disabled:opacity-50",
                  main ? "border-gold-500 bg-gold-700/30 text-gold-100" : "border-stone-600 text-text-secondary hover:border-stone-400",
                )}
              >
                {main ? "★ Main Quest" : "☆ Make Main"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DiaryStep({ weeklyDiary }: Props) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const [title, setTitle] = useState("");
  const [tier, setTier] = useState<DiaryTier>("EASY");
  const claimed = new Set(weeklyDiary.claimedTiers);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-secondary">
        {weeklyDiary.label}. Tracked entries fill in automatically as you play; add your own for anything specific to this week.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {DIARY_TIERS.map((t) => (
          <div key={t} className="rounded-sm border border-stone-700 p-3">
            <p className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <TierShield tier={t} size={18} /> {DIARY_TIER_LABELS[t]}
              {claimed.has(t) && <span className="text-xs text-moss-300">✓ Claimed</span>}
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {weeklyDiary.entries
                .filter((e) => e.tier === t)
                .map((e) => (
                  <li key={e.id} className="flex items-center gap-2">
                    <span aria-hidden className={e.complete ? "text-moss-300" : "text-text-muted"}>
                      {e.complete ? "✓" : "○"}
                    </span>
                    <span className={cx("flex-1", e.complete ? "text-text-secondary" : "text-text-primary")}>
                      {e.title}
                      <span className="sr-only">{e.complete ? " (complete)" : ""}</span>
                    </span>
                    {e.kind === "CUSTOM" && !claimed.has(t) && (
                      <button
                        type="button"
                        className="text-xs text-text-muted hover:text-crimson-300"
                        aria-label={`Remove ${e.title}`}
                        disabled={pending}
                        onClick={() => run(() => removePlanDiaryEntryAction(e.id), () => router.refresh())}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => addPlanDiaryEntryAction(tier, title), () => {
            setTitle("");
            router.refresh();
          });
        }}
      >
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-text-secondary">
          Add a Diary entry for this week
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Finish the garage shelves" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Tier
          <select className={field} value={tier} onChange={(e) => setTier(e.target.value as DiaryTier)}>
            {DIARY_TIERS.filter((t) => !claimed.has(t)).map((t) => (
              <option key={t} value={t}>
                {DIARY_TIER_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <GameButton type="submit" disabled={pending}>
          Add Entry
        </GameButton>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

function Allocate({ plan, today }: Props) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const candidates = plan.active.filter((q) => q.status !== "ON_HOLD").sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "MAIN" ? -1 : 1));
  if (candidates.length === 0) return <p className="text-text-secondary">No active Quests to allocate yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-secondary">Optional: mark the days you expect to work on each Quest. This is a rough sketch, not a calendar — Questly uses it to recommend each day&apos;s Quest.</p>
      {error && <Notice tone="error">{error}</Notice>}
      <ul className="flex flex-col gap-3">
        {candidates.map((q) => {
          const days = new Set(plan.allocation[q.id] ?? []);
          return (
            <li key={q.id} className="rounded-sm border border-stone-700 p-3">
              <p className="flex items-center gap-2 text-text-primary">
                <SkillIcon icon={q.icon} size={20} framed={false} />
                <span className="truncate">{q.title}</span>
                {q.priority === "MAIN" && <Badge tone="gold">Main</Badge>}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`Days for ${q.title}`}>
                {plan.days.map((d) => {
                  const on = days.has(d);
                  const past = d < today;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${WEEKDAY_NAMES[weekdayOf(d)]} ${formatIsoDate(d, { month: "short", day: "numeric" })}`}
                      disabled={pending || past}
                      onClick={() => run(() => setPlanItemAction({ weekStart: plan.weekStart, day: d, questId: q.id, planned: !on }), () => router.refresh())}
                      className={cx(
                        "flex min-h-10 min-w-12 flex-col items-center justify-center rounded-sm border px-1.5 text-xs disabled:opacity-40",
                        on ? "border-gold-500 bg-gold-700/30 text-gold-100" : "border-stone-700 text-text-muted hover:border-stone-500",
                        d === today && "ring-1 ring-blue-400",
                      )}
                    >
                      <span>{WEEKDAY_NAMES[weekdayOf(d)].slice(0, 3)}</span>
                      <span aria-hidden>{on ? "✓" : d.slice(8)}</span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Begin({ plan, weeklyDiary }: Props) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const mains = plan.active.filter((q) => q.priority === "MAIN");
  const slots = Object.values(plan.allocation).reduce((n, d) => n + d.length, 0);
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-2 sm:grid-cols-3">
        <li className="q-well border border-border-dark p-3">
          <span className="q-title block text-2xl text-gold-200">{mains.length}</span>
          <span className="text-xs text-text-muted">Main Quest{mains.length === 1 ? "" : "s"}</span>
        </li>
        <li className="q-well border border-border-dark p-3">
          <span className="q-title block text-2xl text-gold-200">{slots}</span>
          <span className="text-xs text-text-muted">Planned Quest-days</span>
        </li>
        <li className="q-well border border-border-dark p-3">
          <span className="q-title block text-2xl text-gold-200">{weeklyDiary.entries.length}</span>
          <span className="text-xs text-text-muted">Diary entries</span>
        </li>
      </ul>
      {mains.length > 0 && (
        <ul className="flex flex-col gap-1">
          {mains.map((q) => (
            <li key={q.id} className="text-text-primary">
              ★ {q.title}
            </li>
          ))}
        </ul>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {plan.confirmed ? (
        <Notice tone="success">This week&apos;s adventure has begun. You can adjust the plan any time.</Notice>
      ) : null}
      <GameButton
        variant="primary"
        size="lg"
        className="self-start"
        disabled={pending}
        onClick={() => run(() => confirmPlanAction(plan.weekStart), () => router.push("/"))}
      >
        {plan.confirmed ? "Return to the World" : "Begin Adventure"}
      </GameButton>
    </div>
  );
}
