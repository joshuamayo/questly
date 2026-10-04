"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  addVacationAction,
  endVacationAction,
  removeVacationAction,
  updateBalanceAction,
  updateDisplayNameAction,
  updatePreferencesAction,
  updateScheduleAction,
} from "@/app/(realm)/settings/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { GameButton, GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { QuestReward } from "@/game/config/balance";
import { WEEKDAY_NAMES } from "@/game/planning";
import { QUEST_DIFFICULTY_LABELS } from "@/game/vocabulary";
import { isOnVacation, type BalanceOverrides, type CharacterSettings, type EffectiveBalance } from "@/game/settings";
import { QUEST_DIFFICULTIES, type QuestDifficulty } from "@/game/vocabulary";
import { cx } from "@/lib/cx";
import { formatIsoDate, localToday } from "@/lib/dates";
import { useAction } from "@/lib/use-action";

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";
const numberField = field.replace("w-full", "w-full max-w-36 tabular-nums");

type Defaults = EffectiveBalance & { questRewards: Readonly<Record<QuestDifficulty, QuestReward>> };

function Section({ id, title, icon, children, eyebrow }: { id: string; title: string; icon: SpriteName; children: ReactNode; eyebrow?: string }) {
  return (
    <GamePanel as="section" labelledBy={id} className="p-5">
      <SectionHeader id={id} title={title} eyebrow={eyebrow} icon={<PixelIcon name={icon} size={24} />} divider />
      <div className="mt-4">{children}</div>
    </GamePanel>
  );
}

function Saved({ show }: { show: boolean }) {
  return show ? (
    <span role="status" className="text-sm text-moss-300">
      ✓ Saved
    </span>
  ) : null;
}

export function SettingsBoard({
  displayName,
  settings,
  balance,
  defaults,
  presets,
  today,
}: {
  displayName: string;
  settings: CharacterSettings;
  balance: EffectiveBalance;
  defaults: Defaults;
  presets: number[];
  today: string;
}) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileSection displayName={displayName} />
        <ScheduleSection settings={settings} today={today} />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <PreferencesSection settings={settings} presets={presets} dailyCap={balance.focusDailyXpCap} />
        <Section id="settings-recovery" title="Recovery" icon="character">
          <p className="text-text-secondary">
            Fallen behind? A Respawn helps you clear dead commitments, reset realistic targets, and pick one Quest to restart with. Nothing permanent is ever lost.
          </p>
          <GameLinkButton href="/respawn" className="mt-3">
            Begin a Respawn
          </GameLinkButton>
        </Section>
        <BalanceSection balance={balance} defaults={defaults} />
      </div>
    </div>
  );
}

function ProfileSection({ displayName }: { displayName: string }) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);
  return (
    <Section id="settings-profile" title="Profile" icon="character">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          run(() => updateDisplayNameAction(name), () => {
            setSaved(true);
            router.refresh();
          });
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Character name
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex items-center gap-3">
          <GameButton type="submit" disabled={pending || name.trim() === displayName}>
            Save Name
          </GameButton>
          <Saved show={saved} />
        </div>
      </form>
      <p className="mt-4 text-sm text-text-secondary">
        Your appearance, Title, and Skill Cape are chosen in your{" "}
        <Link href="/character" className="text-blue-300 underline-offset-4 hover:underline">
          Character Profile
        </Link>
        .
      </p>
    </Section>
  );
}

function ScheduleSection({ settings, today }: { settings: CharacterSettings; today: string }) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const [workdays, setWorkdays] = useState(settings.workdays);
  const [weekStart, setWeekStart] = useState(settings.weekStart);
  const [planningDay, setPlanningDay] = useState(settings.planningDay);
  const [saved, setSaved] = useState(false);
  const [vStart, setVStart] = useState(today);
  const [vEnd, setVEnd] = useState("");
  const pausedNow = isOnVacation(settings, today);
  const order = [...Array(7).keys()].map((i) => (weekStart + i) % 7);
  const done = () => {
    setSaved(true);
    router.refresh();
  };

  return (
    <Section id="settings-schedule" title="Schedule" icon="diaries" eyebrow="Streaks and Diaries follow this">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          run(() => updateScheduleAction({ workdays, weekStart, planningDay }), done);
        }}
      >
        <fieldset>
          <legend className="text-sm text-text-secondary">Adventuring days — only these can break a streak</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {order.map((d) => {
              const on = workdays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setWorkdays(on ? workdays.filter((w) => w !== d) : [...workdays, d])}
                  className={cx(
                    "min-h-10 min-w-14 rounded-sm border px-2 text-sm",
                    on ? "border-gold-500 bg-gold-700/25 text-gold-100" : "border-stone-700 text-text-muted hover:border-stone-500",
                  )}
                >
                  {on && <span aria-hidden>✓ </span>}
                  {WEEKDAY_NAMES[d].slice(0, 3)}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Week starts on
            <select className={field} value={weekStart} onChange={(e) => setWeekStart(Number(e.target.value))}>
              {WEEKDAY_NAMES.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Weekly planning day
            <select className={field} value={planningDay} onChange={(e) => setPlanningDay(Number(e.target.value))}>
              {WEEKDAY_NAMES.map((n, i) => (
                <option key={n} value={i}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex items-center gap-3">
          <GameButton type="submit" disabled={pending}>
            Save Schedule
          </GameButton>
          <Saved show={saved} />
        </div>
      </form>

      <div className="mt-6 border-t border-stone-700 pt-4">
        <h3 className="q-title text-lg text-gold-300">Vacation &amp; Pause</h3>
        <p className="mt-1 text-sm text-text-secondary">Paused days never break your Adventure or Focus streaks.</p>
        {pausedNow && <Notice className="mt-2">You are currently paused. Enjoy the rest.</Notice>}
        {settings.vacations.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {settings.vacations.map((v, i) => (
              <li key={`${v.start}-${i}`} className="flex flex-wrap items-center gap-2 rounded-sm border border-stone-700 px-3 py-2">
                <span className="flex-1 text-text-primary">
                  {formatIsoDate(v.start)} → {v.end ? formatIsoDate(v.end) : "until you return"}
                </span>
                {!v.end && v.start <= today && (
                  <GameButton size="sm" disabled={pending} onClick={() => run(() => endVacationAction(i, localToday()), () => router.refresh())}>
                    I&apos;m back
                  </GameButton>
                )}
                <GameButton size="sm" variant="ghost" disabled={pending} onClick={() => run(() => removeVacationAction(i), () => router.refresh())}>
                  Remove
                </GameButton>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addVacationAction({ start: vStart, end: vEnd || null }), () => {
              setVEnd("");
              router.refresh();
            });
          }}
        >
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            From
            <input type="date" className={field} value={vStart} onChange={(e) => setVStart(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Until (optional)
            <input type="date" className={field} value={vEnd} min={vStart} onChange={(e) => setVEnd(e.target.value)} />
          </label>
          <GameButton type="submit" disabled={pending}>
            Add Pause
          </GameButton>
        </form>
      </div>
    </Section>
  );
}

function PreferencesSection({ settings, presets, dailyCap }: { settings: CharacterSettings; presets: number[]; dailyCap: number }) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const save = (input: Parameters<typeof updatePreferencesAction>[0]) => run(() => updatePreferencesAction(input), () => router.refresh());
  return (
    <>
      <Section id="settings-focus" title="Focus" icon="skill-focus">
        <fieldset>
          <legend className="text-sm text-text-secondary">Default Focus timer</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {presets.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={settings.focusDefaultMinutes === m}
                disabled={pending}
                onClick={() => save({ focusDefaultMinutes: m })}
                className={cx(
                  "min-h-10 rounded-sm border px-4",
                  settings.focusDefaultMinutes === m ? "border-gold-500 bg-gold-700/25 text-gold-100" : "border-stone-700 text-text-secondary hover:border-stone-500",
                )}
              >
                {settings.focusDefaultMinutes === m && <span aria-hidden>✓ </span>}
                {m} min
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-3 text-sm text-text-secondary">
          Focus XP is capped at {dailyCap} XP in any 24 hours, with smaller rewards after three sessions — rest is part of the game. Adjust it under Game Balance.
        </p>
      </Section>
      <Section id="settings-appearance" title="Appearance" icon="settings">
        <fieldset>
          <legend className="text-sm text-text-secondary">Motion</legend>
          <div className="mt-2 flex flex-col gap-2">
            {(
              [
                ["system", "Follow my device setting"],
                ["reduce", "Always reduce motion"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-text-primary">
                <input
                  type="radio"
                  name="motion"
                  className="size-4 accent-[var(--color-gold-400)]"
                  checked={(settings.motion === "full" ? "system" : settings.motion) === value}
                  disabled={pending}
                  onChange={() => save({ motion: value })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {error && <Notice tone="error" className="mt-3">{error}</Notice>}
      </Section>
    </>
  );
}

function BalanceSection({ balance, defaults }: { balance: EffectiveBalance; defaults: Defaults }) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const [rewards, setRewards] = useState(() => structuredClone(balance.questRewards));
  const [mainCap, setMainCap] = useState(balance.mainQuestCap);
  const [focusCap, setFocusCap] = useState(balance.focusDailyXpCap);
  const [bounty, setBounty] = useState({ ...balance.bounty });
  const [respawn, setRespawn] = useState({ ...balance.respawn });
  const [saved, setSaved] = useState(false);

  /** Only values that differ from the canonical defaults are stored. */
  function overrides(): BalanceOverrides {
    const o: BalanceOverrides = {};
    const qr = Object.fromEntries(QUEST_DIFFICULTIES.filter((d) => JSON.stringify(rewards[d]) !== JSON.stringify(defaults.questRewards[d])).map((d) => [d, rewards[d]]));
    if (Object.keys(qr).length) o.questRewards = qr;
    if (mainCap !== defaults.mainQuestCap) o.mainQuestCap = mainCap;
    if (focusCap !== defaults.focusDailyXpCap) o.focusDailyXpCap = focusCap;
    const b = Object.fromEntries(Object.entries(bounty).filter(([k, v]) => defaults.bounty[k as keyof typeof bounty] !== v));
    if (Object.keys(b).length) o.bounty = b;
    const r = Object.fromEntries(Object.entries(respawn).filter(([k, v]) => defaults.respawn[k as keyof typeof respawn] !== v));
    if (Object.keys(r).length) o.respawn = r;
    return o;
  }

  const num = (v: string) => (v === "" ? NaN : Number(v));

  return (
    <GamePanel as="section" labelledBy="settings-balance" className="p-5">
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-2.5 [&::-webkit-details-marker]:hidden">
          <PixelIcon name="total-level" size={22} />
          <h2 id="settings-balance" className="q-title text-lg text-text-secondary">
            Game Balance — Advanced
          </h2>
          <span aria-hidden className="ml-auto text-text-muted">▾</span>
        </summary>
        <Notice className="mt-4">
          Changing game balance can make progression less meaningful. Existing accepted quest rewards will not be retroactively changed.
        </Notice>
        <form
          className="mt-4 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(false);
            run(() => updateBalanceAction(overrides()), () => {
              setSaved(true);
              router.refresh();
            });
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm">
              <caption className="mb-2 text-left text-text-secondary">Quest rewards by difficulty</caption>
              <thead>
                <tr className="text-left text-text-muted">
                  <th scope="col" className="py-1 font-normal">Difficulty</th>
                  <th scope="col" className="py-1 font-normal">XP</th>
                  <th scope="col" className="py-1 font-normal">GP</th>
                  <th scope="col" className="py-1 font-normal">QP</th>
                </tr>
              </thead>
              <tbody>
                {QUEST_DIFFICULTIES.map((d) => (
                  <tr key={d}>
                    <th scope="row" className="py-1 pr-2 text-left font-normal text-text-primary">
                      {QUEST_DIFFICULTY_LABELS[d]}
                    </th>
                    {(["xp", "gp", "qp"] as const).map((k) => (
                      <td key={k} className="py-1 pr-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          aria-label={`${QUEST_DIFFICULTY_LABELS[d]} ${k.toUpperCase()}`}
                          className={numberField}
                          value={Number.isNaN(rewards[d][k]) ? "" : rewards[d][k]}
                          onChange={(e) => setRewards({ ...rewards, [d]: { ...rewards[d], [k]: num(e.target.value) } })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Main Quest cap
              <input type="number" min={1} max={10} className={numberField} value={Number.isNaN(mainCap) ? "" : mainCap} onChange={(e) => setMainCap(num(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Daily Focus XP cap
              <input type="number" min={0} className={numberField} value={Number.isNaN(focusCap) ? "" : focusCap} onChange={(e) => setFocusCap(num(e.target.value))} />
            </label>
          </div>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm text-text-secondary">Boss bounty (bonus GP)</legend>
            {(
              [
                ["earlyGp", "Before the target date"],
                ["byTargetGp", "On the target date"],
                ["byDeadlineGp", "By the hard deadline"],
                ["lateGp", "After the deadline"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex flex-col gap-1 text-sm text-text-secondary">
                {label}
                <input type="number" min={0} className={numberField} value={Number.isNaN(bounty[k]) ? "" : bounty[k]} onChange={(e) => setBounty({ ...bounty, [k]: num(e.target.value) })} />
              </label>
            ))}
          </fieldset>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm text-text-secondary">Respawn suggestion thresholds</legend>
            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Missed adventuring days
              <input type="number" min={1} className={numberField} value={Number.isNaN(respawn.missedPlannedWorkdays) ? "" : respawn.missedPlannedWorkdays} onChange={(e) => setRespawn({ ...respawn, missedPlannedWorkdays: num(e.target.value) })} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Quests needing attention
              <input type="number" min={1} className={numberField} value={Number.isNaN(respawn.questsNeedingAttention) ? "" : respawn.questsNeedingAttention} onChange={(e) => setRespawn({ ...respawn, questsNeedingAttention: num(e.target.value) })} />
            </label>
          </fieldset>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-wrap items-center gap-3">
            <GameButton type="submit" disabled={pending}>
              Save Game Balance
            </GameButton>
            <GameButton
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(() => updateBalanceAction({}), () => {
                  setRewards(structuredClone({ ...defaults.questRewards }) as Record<QuestDifficulty, QuestReward>);
                  setMainCap(defaults.mainQuestCap);
                  setFocusCap(defaults.focusDailyXpCap);
                  setBounty({ ...defaults.bounty });
                  setRespawn({ ...defaults.respawn });
                  setSaved(true);
                  router.refresh();
                })
              }
            >
              Restore defaults
            </GameButton>
            <Saved show={saved} />
          </div>
        </form>
      </details>
    </GamePanel>
  );
}
