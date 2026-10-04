import Image from "next/image";
import { WorldVista } from "@/components/art/WorldVista";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { GamePanel } from "@/components/ui/GamePanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatNumber } from "@/lib/format";
import { cx } from "@/lib/cx";
import type { SkillSheet } from "@/server/queries/character-sheet";
import { skillColor } from "./skill-style";

/** Selected-Skill hero: icon, level, XP bar, and the Skill's scene art. */
export function SkillHero({ skill, sceneUrl }: { skill: SkillSheet; sceneUrl: string | null }) {
  const p = skill.progress;
  return (
    <GamePanel as="section" labelledBy="skill-hero-title" className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-y-0 right-0 -z-10 w-full md:w-[55%]">
        {sceneUrl ? (
          <Image src={sceneUrl} alt="" fill unoptimized sizes="50vw" className="q-pixel object-cover" />
        ) : (
          <WorldVista />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-stone-900)_5%,rgb(17_23_32/0.6)_45%,transparent)]" />
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
        <SkillIcon icon={skill.icon} size={72} />
        <div className="min-w-0 flex-1 md:max-w-[60%]">
          <h2 id="skill-hero-title" className="q-title text-display-lg leading-none text-gold-300">
            {skill.name}
          </h2>
          <p className="q-title mt-1 text-2xl text-gold-200">
            Level {p.level} <span className="text-text-muted">/ 99</span>
          </p>
          <p className="mt-1 text-text-primary">{skill.motto}</p>
        </div>
      </div>
      <div className="px-5 pb-5 sm:px-6 md:max-w-[70%]">
        <div className="flex items-center gap-3">
          <ProgressBar
            className="flex-1"
            size="lg"
            color={skillColor(skill.key)}
            value={p.percentToNext}
            label={`${skill.name} progress to ${p.isMaxLevel ? "maximum level" : `Level ${p.level + 1}`}`}
            valueText={p.isMaxLevel ? "Maximum level" : `${p.percentToNext}%, ${formatNumber(p.xpRemaining)} XP remaining`}
          />
          <span className="shrink-0 text-sm tabular-nums text-text-primary">
            {formatNumber(p.totalXp)}
            {p.nextLevelXp !== null && <span className="text-text-muted"> / {formatNumber(p.nextLevelXp)} XP</span>}
          </span>
        </div>
        <p className="mt-1.5 text-text-secondary">
          {p.isMaxLevel
            ? "Level 99 reached. XP continues to accumulate."
            : `Next level (${p.level + 1}): ${formatNumber(p.xpRemaining)} XP remaining`}
        </p>
      </div>
    </GamePanel>
  );
}

type Milestone = { key: string; level: number; title: string; detail: string; state: "done" | "current" | "next" | "locked" };

function milestonesFor(skill: SkillSheet): Milestone[] {
  const p = skill.progress;
  const list: Milestone[] = [
    {
      key: "cape",
      level: 99,
      title: `${skill.name} Cape`,
      detail: "The cosmetic mark of mastery.",
      state: p.isMaxLevel ? "done" : "locked",
    },
  ];
  if (!p.isMaxLevel && p.level + 1 < 99) {
    list.push({
      key: "next",
      level: p.level + 1,
      title: `Level ${p.level + 1}`,
      detail: `${formatNumber(p.xpRemaining)} XP away`,
      state: "next",
    });
  }
  if (!p.isMaxLevel) {
    list.push({ key: "current", level: p.level, title: "Current Level", detail: `${formatNumber(p.totalXp)} XP earned`, state: "current" });
  }
  list.push({ key: "start", level: 1, title: "Began training", detail: "Every legend starts at Level 1.", state: "done" });
  return list;
}

/** Vertical milestone track: real thresholds only, no invented unlocks. */
export function SkillMilestones({ skill }: { skill: SkillSheet }) {
  return (
    <GamePanel as="section" labelledBy="skill-milestones" className="p-4">
      <SectionHeader id="skill-milestones" icon={<PixelIcon name="total-level" size={22} />} title="Level Milestones" divider />
      <ol className="relative mt-3 flex flex-col gap-2 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-0.5 before:bg-stone-600">
        {milestonesFor(skill).map((m) => (
          <li key={m.key} className="relative flex items-center gap-3">
            <span
              aria-hidden
              className={cx(
                "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                m.state === "done" && "border-moss-400 bg-moss-600 text-white",
                m.state === "current" && "border-blue-300 bg-blue-500 shadow-[0_0_10px_var(--color-blue-400)]",
                m.state === "next" && "border-gold-400 bg-stone-900",
                m.state === "locked" && "border-stone-500 bg-stone-900",
              )}
            >
              {m.state === "done" ? "✓" : null}
            </span>
            <div
              className={cx(
                "q-tile flex flex-1 items-center gap-3 px-3 py-2",
                m.state === "current" && "border-blue-500",
                m.state === "next" && "border-gold-600",
              )}
            >
              {m.state === "locked" && <PixelIcon name="lock" size={18} />}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gold-300">Level {m.level}</p>
                <p className="font-bold text-text-primary">{m.title}</p>
                <p className="text-sm text-text-muted">{m.detail}</p>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                {m.state === "done" ? "Reached" : m.state === "current" ? "Current" : m.state === "next" ? "Next" : "Locked"}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-text-muted">
        Titles, frames, and Quest content tied to Skill levels arrive in a later update.
      </p>
    </GamePanel>
  );
}

/** About + XP record for the selected Skill. */
export function SkillRecord({ skill }: { skill: SkillSheet }) {
  const p = skill.progress;
  const rows: Array<[string, string]> = [
    ["Total XP", formatNumber(p.totalXp)],
    [`Level ${p.level} reached at`, `${formatNumber(p.currentLevelXp)} XP`],
    [p.isMaxLevel ? "Maximum level" : `Level ${p.level + 1} at`, p.nextLevelXp === null ? "—" : `${formatNumber(p.nextLevelXp)} XP`],
    ["XP to Level 99", skill.mastery.xpRemaining ? formatNumber(skill.mastery.xpRemaining) : "Reached"],
  ];
  return (
    <GamePanel as="section" surface="parchment" labelledBy="skill-record" className="p-5">
      <SectionHeader id="skill-record" tone="parchment" title={`About ${skill.name}`} divider />
      <p className="mt-3 text-parchment-ink">{skill.description}</p>
      <dl className="mt-4 divide-y divide-parchment-400/50">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 py-1.5">
            <dt className="text-parchment-ink-soft">{k}</dt>
            <dd className="font-bold tabular-nums text-parchment-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </GamePanel>
  );
}

/** Next unlock: the Level 99 Skill Cape, with real progress toward it. */
export function NextUnlock({ skill }: { skill: SkillSheet }) {
  const m = skill.mastery;
  const done = m.xpRemaining === 0;
  return (
    <GamePanel as="section" labelledBy="next-unlock" className="p-4">
      <SectionHeader id="next-unlock" icon={<PixelIcon name="total-level" size={22} />} title="Next Unlock" divider />
      <div className="mt-3 flex gap-3">
        <div className="q-well flex size-16 shrink-0 items-center justify-center border border-stone-600">
          <PixelIcon name={done ? "total-level" : "lock"} size={34} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">Level 99</p>
          <p className="q-title text-xl text-gold-300">{skill.name} Cape</p>
          <p className="text-sm text-text-secondary">A cosmetic cape worn by those who master this Skill.</p>
        </div>
      </div>
      <ProgressBar
        className="mt-3"
        tone="moss"
        value={m.percent}
        label={`${skill.name} progress to Level 99`}
        valueText={done ? "Unlocked" : `${formatNumber(m.xpRemaining)} XP remaining`}
      />
      <p className="mt-1 text-sm text-text-muted">{done ? "Unlocked." : `${formatNumber(m.xpRemaining)} XP remaining`}</p>
    </GamePanel>
  );
}
