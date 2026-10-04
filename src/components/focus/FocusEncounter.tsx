"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cancelFocusAction, completeFocusAction, startFocusAction } from "@/app/focus/actions";
import { setObjectiveDoneAction } from "@/app/(realm)/quests/actions";
import { WorldVista } from "@/components/art/WorldVista";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { DifficultyBadge } from "@/components/quests/DifficultyBadge";
import { skillColor } from "@/components/skills/skill-style";
import { GameButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { allocateObjectiveXp } from "@/game/quests";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import type { QuestDetail } from "@/server/queries/quests";

type Session = { id: string; startedAt: string; plannedMinutes: number };
type Config = { presets: number[]; cap: number; tiers: { minMinutes: number; xp: number }[] };
type Result = { minutes: number; xp: number; capped: boolean; multiplier: number; minimumMinutes: number; leveledUp: boolean; newLevel: number | null };

function baseXp(minutes: number, tiers: Config["tiers"]) {
  return tiers.find((t) => minutes >= t.minMinutes)?.xp ?? 0;
}

function format(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Focus Mode encounter: one Quest, one Current Step, a server-timed session.
 * Objective completion here advances the Quest; Focus XP comes only from
 * the session itself, capped daily.
 */
export function FocusEncounter({
  quest,
  session: initialSession,
  stats,
  config,
}: {
  quest: QuestDetail | null;
  session: Session | null;
  stats: { sessions: number; minutes: number; xp: number };
  config: Config;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [minutes, setMinutes] = useState(initialSession?.plannedMinutes ?? config.presets[0]);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [drop, setDrop] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const finishing = useRef(false);

  const endsAt = session ? Date.parse(session.startedAt) + session.plannedMinutes * 60_000 : null;
  const remaining = endsAt ? endsAt - now : minutes * 60_000;
  const elapsedMin = session ? Math.floor((now - Date.parse(session.startedAt)) / 60_000) : 0;
  const current = quest?.objectives.find((o) => o.id === quest.progress.currentObjectiveId) ?? null;
  const shares = quest ? allocateObjectiveXp(quest.rewards.xp, quest.objectives.length) : [];
  const capLeft = Math.max(0, config.cap - stats.xp);
  const minimum = Math.min(...config.tiers.map((t) => t.minMinutes));

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  // Changes only at each 5-minute boundary, so screen readers hear it rarely.
  const fiveMinuteMark = session ? Math.max(0, Math.ceil(remaining / 300_000) * 5) : null;

  function act<T>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, onOk: (d: T) => void) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) onOk(r.data);
      else setError(r.error);
    });
  }

  function start() {
    setResult(null);
    act(() => startFocusAction({ minutes, questId: quest?.id ?? null, objectiveId: current?.id ?? null }), (s) => {
      setSession(s);
      setNow(Date.now());
      setAnnouncement(`Focus session started: ${s.plannedMinutes} minutes.`);
    });
  }

  function finish() {
    if (!session || finishing.current) return;
    finishing.current = true;
    act(() => completeFocusAction(session.id), (r) => {
      setResult(r);
      setSession(null);
      finishing.current = false;
      setAnnouncement(r.xp > 0 ? `Session complete. ${r.xp} Focus XP earned.` : "Session complete.");
      router.refresh();
    });
  }

  useEffect(() => {
    if (session && endsAt && now >= endsAt) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  function toggleObjective(id: string, done: boolean, share: number) {
    if (!quest) return;
    act(() => setObjectiveDoneAction(quest.id, id, done), () => {
      if (done) {
        setDrop(`Objective complete · ${formatNumber(share)} of the Quest's ${formatNumber(quest.rewards.xp)} XP is waiting at Quest completion`);
        setTimeout(() => setDrop(null), 3500);
      }
      router.refresh();
    });
  }

  const pct = session ? Math.min(100, ((now - Date.parse(session.startedAt)) / (session.plannedMinutes * 60_000)) * 100) : 0;

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_20rem]">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <p className="sr-only" aria-live="polite">
        {fiveMinuteMark ? `About ${fiveMinuteMark} minutes remaining.` : ""}
      </p>

      {/* ── Quest ───────────────────────────────────────────────────── */}
      <GamePanel as="section" surface="parchment" aria-label="Current Quest" className="p-5">
        {quest ? (
          <>
            <div className="flex items-start gap-3">
              <SkillIcon icon={quest.icon} size={44} />
              <div className="min-w-0">
                {quest.questline && <p className="text-xs font-bold uppercase tracking-wider text-parchment-ink-soft">{quest.questline.title}</p>}
                <h1 className="q-title text-2xl leading-tight text-parchment-ink">{quest.title}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={quest.difficulty} />
                  <span className="text-sm font-bold text-parchment-ink-soft">{quest.skillName}</span>
                </div>
              </div>
            </div>
            {quest.progress.total > 0 && (
              <ProgressBar
                className="mt-3"
                color={skillColor(quest.skillKey)}
                value={quest.progress.percent}
                label="Quest progress"
                valueText={`${quest.progress.done} of ${quest.progress.total} objectives`}
              />
            )}
            {current ? (
              <div className="mt-4 rounded-sm border-2 border-blue-500 bg-blue-300/20 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Current Step</p>
                <p className="q-title text-xl text-parchment-ink">{current.title}</p>
              </div>
            ) : (
              <p className="mt-4 text-parchment-ink-soft">
                {quest.objectives.length ? "Every objective is complete." : "This Quest has no objectives."}{" "}
                <Link href={`/quests/${quest.id}`} className="font-bold underline">
                  Open the Quest to complete it.
                </Link>
              </p>
            )}
            <ol className="mt-3 flex flex-col gap-1.5">
              {quest.objectives.map((o, i) => (
                <li key={o.id} className={cx("flex items-center gap-2 rounded-sm px-2 py-1.5", o.id === current?.id && "bg-parchment-300/50")}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={o.done}
                    aria-label={`${o.done ? "Mark incomplete" : "Mark complete"}: ${o.title}`}
                    disabled={pending}
                    onClick={() => toggleObjective(o.id, !o.done, shares[i] ?? 0)}
                    className={cx(
                      "flex size-6 shrink-0 items-center justify-center rounded-xs border-2 text-xs font-bold",
                      o.done ? "border-moss-600 bg-moss-500 text-white" : "border-parchment-ink-soft",
                    )}
                  >
                    {o.done ? "✓" : ""}
                  </button>
                  <span className={cx("flex-1", o.done ? "text-parchment-ink-soft line-through" : "text-parchment-ink")}>{o.title}</span>
                </li>
              ))}
            </ol>
            <Link href={`/quests/${quest.id}`} className="mt-4 inline-block text-sm font-bold text-parchment-ink underline">
              View full Quest →
            </Link>
          </>
        ) : (
          <div className="text-center">
            <PixelIcon name="quests" size={48} className="mx-auto" />
            <h1 className="q-title mt-2 text-2xl text-parchment-ink">Open Focus</h1>
            <p className="mt-1 text-parchment-ink-soft">No Quest selected. You can still run a Focus session, or choose a Quest to focus on.</p>
            <Link href="/quests" className="mt-3 inline-block font-bold underline">
              Open Quest Journal
            </Link>
          </div>
        )}
      </GamePanel>

      {/* ── Timer ───────────────────────────────────────────────────── */}
      <section aria-label="Focus timer" className="q-frame-gold relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10">
          <WorldVista />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_14_19/0.35),rgb(11_14_19/0.85))]" />
        </div>
        <div className="flex min-h-[26rem] flex-col items-center justify-end gap-4 p-6 text-center">
          <div role="timer" aria-label={session ? "Time remaining" : "Session length"} className="q-title text-[clamp(4rem,10vw,7rem)] leading-none text-text-primary [text-shadow:0_4px_0_rgb(0_0_0/0.8)]">
            {format(remaining)}
          </div>
          <p className="text-text-secondary">{session ? `Focus session · ${session.plannedMinutes} min` : "Choose a session length"}</p>
          {session && (
            <ProgressBar className="w-full max-w-sm" tone="gold" value={pct} label="Session progress" valueText={`${elapsedMin} of ${session.plannedMinutes} minutes`} />
          )}
          {session ? (
            <div className="flex flex-wrap justify-center gap-2">
              <GameButton variant="primary" size="lg" disabled={pending} onClick={finish}>
                End Session
              </GameButton>
              <GameButton
                variant="secondary"
                size="lg"
                disabled={pending}
                onClick={() =>
                  act(() => cancelFocusAction(session.id), () => {
                    setSession(null);
                    setAnnouncement("Session cancelled.");
                  })
                }
              >
                Cancel
              </GameButton>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Session length">
                {config.presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={minutes === p}
                    onClick={() => setMinutes(p)}
                    className={cx(
                      "min-h-11 min-w-24 rounded-sm border px-4 text-text-primary",
                      minutes === p ? "border-blue-400 bg-blue-700/60" : "border-stone-600 bg-stone-900/80 hover:border-stone-400",
                    )}
                  >
                    {p} min
                  </button>
                ))}
              </div>
              <GameButton variant="primary" size="lg" className="min-w-64" disabled={pending} onClick={start}>
                ▶ Start Focus Session
              </GameButton>
            </>
          )}
          {session && elapsedMin < minimum && (
            <p className="text-sm text-text-muted">Ending before {minimum} minutes earns no Focus XP.</p>
          )}
        </div>
      </section>

      {/* ── Session info ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {error && <Notice tone="error">{error}</Notice>}
        {result && (
          <Notice tone={result.xp > 0 ? "success" : "info"}>
            {result.xp > 0
              ? `Session complete: ${result.minutes} minutes, +${result.xp} Focus XP${result.leveledUp ? ` — Focus reached Level ${result.newLevel}!` : ""}${result.capped ? " (daily cap reached)" : ""}.`
              : result.minutes < result.minimumMinutes
                ? `Session complete: ${result.minutes} minutes. Sessions of ${result.minimumMinutes}+ minutes earn Focus XP.`
                : `Session complete: ${result.minutes} minutes. You have reached today's Focus XP cap — rest is part of the game too.`}
          </Notice>
        )}
        {drop && (
          <p role="status" className="q-enter rounded-sm border border-gold-600 bg-gold-700/30 px-3 py-2 text-sm text-gold-100">
            {drop}
          </p>
        )}
        <GamePanel as="section" labelledBy="focus-rewards" className="p-4">
          <SectionHeader id="focus-rewards" icon={<SkillIcon icon="skill-focus" size={22} framed={false} />} title="Session Reward" divider />
          <p className="mt-3 text-text-primary">
            {baseXp(session?.plannedMinutes ?? minutes, config.tiers) > 0 ? (
              <>
                Up to <span className="font-bold">+{baseXp(session?.plannedMinutes ?? minutes, config.tiers)} Focus XP</span> for a full session.
              </>
            ) : (
              <>Sessions of {minimum}+ minutes earn Focus XP.</>
            )}
          </p>
          <ul className="mt-2 text-sm text-text-secondary">
            {[...config.tiers].reverse().map((t) => (
              <li key={t.minMinutes}>
                {t.minMinutes} min → {t.xp} Focus XP
              </li>
            ))}
          </ul>
        </GamePanel>
        <GamePanel as="section" labelledBy="focus-today" className="p-4">
          <SectionHeader id="focus-today" icon={<PixelIcon name="skills" size={22} />} title="Last 24 Hours" divider />
          <dl className="mt-2 text-sm">
            <div className="flex justify-between py-1">
              <dt className="text-text-secondary">Sessions</dt>
              <dd className="text-text-primary">{stats.sessions}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-text-secondary">Minutes focused</dt>
              <dd className="text-text-primary">{stats.minutes}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-text-secondary">Focus XP</dt>
              <dd className="text-text-primary">
                {stats.xp} / {config.cap}
              </dd>
            </div>
          </dl>
          <ProgressBar className="mt-1" color={skillColor("focus")} value={(stats.xp / config.cap) * 100} label="Daily Focus XP" valueText={`${stats.xp} of ${config.cap}`} />
          <p className="mt-2 text-xs text-text-muted">
            {capLeft > 0 ? `${capLeft} Focus XP left today. After 3 sessions, each earns half.` : "Daily Focus XP cap reached. Rest well."}
          </p>
        </GamePanel>
      </div>
    </div>
  );
}
