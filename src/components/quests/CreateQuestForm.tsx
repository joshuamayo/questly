"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { createQuestAction } from "@/app/(realm)/quests/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { skillColor } from "@/components/skills/skill-style";
import { GameButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LIMITS, rewardsFor } from "@/game/quests";
import { QUEST_DIFFICULTIES, QUEST_DIFFICULTY_LABELS, type QuestDifficulty, type SkillKey } from "@/game/vocabulary";
import { cx } from "@/lib/cx";
import { DifficultyBadge } from "./DifficultyBadge";
import { RewardTiles } from "./RewardTiles";

type SkillOption = { key: SkillKey; name: string; icon: string; motto: string };

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";
const label = "mb-1 block text-sm font-bold text-text-secondary";

/**
 * Create Quest with progressive disclosure (CLAUDE.md §36): the essentials
 * up front, objectives encouraged, everything else under Advanced options.
 * Rewards are derived from difficulty — never chosen.
 */
export function CreateQuestForm({
  skills,
  activeMainCount,
  mainQuestCap,
  initialSkill,
}: {
  skills: SkillOption[];
  activeMainCount: number;
  mainQuestCap: number;
  initialSkill?: SkillKey;
}) {
  const router = useRouter();
  const ids = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillKey, setSkillKey] = useState<SkillKey>(initialSkill ?? skills[0].key);
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("INTERMEDIATE");
  const [targetDate, setTargetDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priority, setPriority] = useState<"MAIN" | "SIDE">("SIDE");
  const [notes, setNotes] = useState("");

  const rewards = rewardsFor(difficulty);
  const skill = skills.find((s) => s.key === skillKey)!;
  const mainFull = activeMainCount >= mainQuestCap;
  const filledObjectives = objectives.map((o) => o.trim()).filter(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createQuestAction({
        title,
        description,
        skillKey,
        difficulty,
        targetDate: targetDate || null,
        deadline: deadline || null,
        priority,
        objectives: filledObjectives,
        notes,
      });
      if (result.ok) router.push(`/quests/${result.data}?accepted=1`);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]" noValidate>
      <div className="flex flex-col gap-4">
        <GamePanel as="section" labelledBy={`${ids}-details`} className="p-5">
          <SectionHeader id={`${ids}-details`} icon={<Step n={1} />} title="Quest Details" divider />
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor={`${ids}-title`} className={label}>
                Quest name <span className="text-gold-300">*</span>
              </label>
              <input
                id={`${ids}-title`}
                className={field}
                value={title}
                maxLength={LIMITS.titleMax}
                required
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Publish the AI Side Hustles video"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor={`${ids}-desc`} className={label}>
                Story <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <textarea
                id={`${ids}-desc`}
                className={cx(field, "min-h-20")}
                value={description}
                maxLength={LIMITS.descriptionMax}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this adventure, and why does it matter?"
              />
            </div>

            <fieldset>
              <legend className={label}>Skill</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {skills.map((s) => (
                  <label
                    key={s.key}
                    className={cx(
                      "q-tile flex cursor-pointer items-center gap-2 px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring",
                      skillKey === s.key && "border-gold-400 shadow-glow-gold",
                    )}
                  >
                    <input
                      type="radio"
                      name="skill"
                      value={s.key}
                      checked={skillKey === s.key}
                      onChange={() => setSkillKey(s.key)}
                      className="sr-only"
                    />
                    <SkillIcon icon={s.icon} size={24} framed={false} />
                    <span className="text-text-primary">{s.name}</span>
                    {skillKey === s.key && <span className="ml-auto text-gold-300" aria-hidden>✓</span>}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={label}>Difficulty</legend>
              <div className="flex flex-wrap gap-2">
                {QUEST_DIFFICULTIES.map((d) => (
                  <label
                    key={d}
                    className={cx(
                      "q-tile flex cursor-pointer flex-col items-start gap-1 px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring",
                      difficulty === d && "border-gold-400 shadow-glow-gold",
                    )}
                  >
                    <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} className="sr-only" />
                    <DifficultyBadge difficulty={d} />
                    <span className="text-xs text-text-muted">{rewardsFor(d).xp.toLocaleString("en-US")} XP</span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-sm text-text-muted">Difficulty sets the rewards. Choose honestly — it is your adventure.</p>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${ids}-target`} className={label}>
                  Target date <span className="font-normal text-text-muted">(when you intend to finish)</span>
                </label>
                <input id={`${ids}-target`} type="date" className={field} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor={`${ids}-deadline`} className={label}>
                  Hard deadline <span className="font-normal text-text-muted">(optional — when it truly must be done)</span>
                </label>
                <input id={`${ids}-deadline`} type="date" className={field} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
          </div>
        </GamePanel>

        <GamePanel as="section" labelledBy={`${ids}-objectives`} className="p-5">
          <SectionHeader id={`${ids}-objectives`} icon={<Step n={2} />} title="Objectives" divider />
          <p className="mt-3 text-sm text-text-secondary">
            Break the Quest into steps. Objectives track progress; the Quest awards its rewards when it is complete.
          </p>
          <ol className="mt-3 flex flex-col gap-2">
            {objectives.map((o, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-6 text-right text-sm tabular-nums text-text-muted">{i + 1}.</span>
                <input
                  className={field}
                  value={o}
                  maxLength={LIMITS.objectiveTitleMax}
                  aria-label={`Objective ${i + 1}`}
                  placeholder={i === 0 ? "First step…" : "Next step…"}
                  onChange={(e) => setObjectives((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (o.trim() && objectives.length < LIMITS.objectivesMax) setObjectives((l) => [...l.slice(0, i + 1), "", ...l.slice(i + 1)]);
                    }
                  }}
                />
                <button
                  type="button"
                  aria-label={`Remove objective ${i + 1}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-stone-600 text-text-muted hover:border-crimson-500 hover:text-crimson-300"
                  onClick={() => setObjectives((l) => (l.length === 1 ? [""] : l.filter((_, j) => j !== i)))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
          <GameButton
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={objectives.length >= LIMITS.objectivesMax}
            onClick={() => setObjectives((l) => [...l, ""])}
          >
            + Add Objective
          </GameButton>
        </GamePanel>

        <GamePanel as="section" labelledBy={`${ids}-advanced`} className="p-5">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            aria-expanded={showAdvanced}
            aria-controls={`${ids}-advanced-body`}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <SectionHeader id={`${ids}-advanced`} icon={<Step n={3} />} title="Advanced options" eyebrow="Optional" />
            <span aria-hidden className="text-xl text-gold-300">{showAdvanced ? "▴" : "▾"}</span>
          </button>
          {showAdvanced && (
            <div id={`${ids}-advanced-body`} className="mt-4 grid gap-4">
              <fieldset>
                <legend className={label}>Priority</legend>
                <div className="flex flex-wrap gap-2">
                  {(["SIDE", "MAIN"] as const).map((p) => (
                    <label
                      key={p}
                      className={cx(
                        "q-tile flex cursor-pointer items-center gap-2 px-3 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring",
                        priority === p && "border-gold-400 shadow-glow-gold",
                        p === "MAIN" && mainFull && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        disabled={p === "MAIN" && mainFull}
                        checked={priority === p}
                        onChange={() => setPriority(p)}
                        className="sr-only"
                      />
                      <PixelIcon name={p === "MAIN" ? "total-level" : "combat"} size={18} />
                      <span className="text-text-primary">{p === "MAIN" ? "Main Quest" : "Side Quest"}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-sm text-text-muted">
                  {mainFull
                    ? `You already have ${mainQuestCap} Main Quests. Complete one to choose another.`
                    : `Main Quests are your top priorities — up to ${mainQuestCap} at a time (${activeMainCount} chosen).`}
                </p>
              </fieldset>
              <div>
                <label htmlFor={`${ids}-notes`} className={label}>
                  Notes
                </label>
                <textarea id={`${ids}-notes`} className={cx(field, "min-h-24")} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <p className="text-sm text-text-muted">Questlines, requirements, and Boss designation arrive with those systems.</p>
            </div>
          )}
        </GamePanel>
      </div>

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 xl:sticky xl:top-20">
        <GamePanel as="section" surface="parchment" labelledBy={`${ids}-preview`} className="p-5">
          <SectionHeader id={`${ids}-preview`} tone="parchment" title="Quest Preview" divider />
          <div className="mt-3 flex items-start gap-3">
            <SkillIcon icon={skill.icon} size={40} />
            <div className="min-w-0">
              <p className="q-title text-2xl leading-tight text-parchment-ink">{title.trim() || "Untitled Quest"}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <DifficultyBadge difficulty={difficulty} />
                <span className="text-sm font-bold" style={{ color: `color-mix(in oklab, ${skillColor(skillKey)}, black 35%)` }}>
                  {skill.name}
                </span>
                {priority === "MAIN" && <span className="text-sm font-bold text-parchment-ink">Main Quest</span>}
              </div>
            </div>
          </div>
          {description.trim() && <p className="mt-3 italic text-parchment-ink-soft">{description}</p>}
          {filledObjectives.length > 0 && (
            <ol className="mt-3 space-y-1">
              {filledObjectives.map((o, i) => (
                <li key={i} className="flex gap-2 text-parchment-ink">
                  <span aria-hidden className="mt-0.5 inline-block size-4 shrink-0 rounded-xs border-2 border-parchment-ink-soft" />
                  {o}
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-sm font-bold uppercase tracking-wider text-parchment-ink-soft">Rewards on completion</p>
          <RewardTiles className="mt-2" tone="parchment" rewards={rewards} skillKey={skillKey} skillName={skill.name} />
          <p className="mt-2 text-xs text-parchment-ink-soft">
            Set by {QUEST_DIFFICULTY_LABELS[difficulty]} difficulty and locked in when you accept.
          </p>
        </GamePanel>
        {error && <Notice tone="error">{error}</Notice>}
        <GameButton type="submit" variant="primary" size="lg" disabled={pending || !title.trim()}>
          {pending ? "Accepting…" : "Create & Accept Quest →"}
        </GameButton>
      </div>
    </form>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span aria-hidden className="flex size-7 items-center justify-center rounded-full border-2 border-gold-500 bg-gold-700/40 text-sm font-bold text-gold-200">
      {n}
    </span>
  );
}
