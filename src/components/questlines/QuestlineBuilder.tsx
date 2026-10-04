"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { createQuestlineAction } from "@/app/(realm)/questlines/actions";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { GameButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { layoutDepths } from "@/game/questlines";
import { rewardsFor } from "@/game/quests";
import type { RequirementInput, RequirementType } from "@/game/requirements";
import { QUEST_DIFFICULTIES, QUEST_DIFFICULTY_LABELS, type QuestDifficulty, type SkillKey } from "@/game/vocabulary";
import { cx } from "@/lib/cx";
import { formatNumber } from "@/lib/format";
import { QuestlineMap, type MapNode } from "./QuestlineMap";

type Skill = { key: SkillKey; name: string };
type DraftNode = {
  key: string;
  title: string;
  skillKey: SkillKey;
  difficulty: QuestDifficulty;
  objectives: string;
  parents: string[];
  requirements: RequirementInput[];
};

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";
const label = "mb-1 block text-sm font-bold text-text-secondary";

const REQ_TYPES: { type: RequirementType; label: string }[] = [
  { type: "SKILL_LEVEL", label: "Skill level" },
  { type: "QUEST_POINTS", label: "Quest Points" },
  { type: "COMBAT_POINTS", label: "Combat Points" },
  { type: "DATE_REACHED", label: "Date reached" },
  { type: "MANUAL", label: "Manual" },
];

let counter = 0;
const newKey = () => `node-${++counter}-${Math.random().toString(36).slice(2, 7)}`;

export function QuestlineBuilder({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const ids = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillKey, setSkillKey] = useState<SkillKey>(skills[0].key);
  const [nodes, setNodes] = useState<DraftNode[]>(() => [
    { key: newKey(), title: "", skillKey: skills[0].key, difficulty: "INTERMEDIATE", objectives: "", parents: [], requirements: [] },
  ]);

  const update = (key: string, patch: Partial<DraftNode>) => setNodes((list) => list.map((n) => (n.key === key ? { ...n, ...patch } : n)));
  const addNode = () =>
    setNodes((list) => [
      ...list,
      { key: newKey(), title: "", skillKey, difficulty: "INTERMEDIATE", objectives: "", parents: list.length ? [list[list.length - 1].key] : [], requirements: [] },
    ]);
  const removeNode = (key: string) =>
    setNodes((list) => list.filter((n) => n.key !== key).map((n) => ({ ...n, parents: n.parents.filter((p) => p !== key) })));

  const preview: MapNode[] = useMemo(() => {
    const edges = nodes.flatMap((n) => n.parents.map((p) => ({ parent: p, child: n.key })));
    const depths = layoutDepths(nodes.map((n) => n.key), edges);
    const rowsUsed = new Map<number, number>();
    return nodes.map((n, i) => {
      const depth = depths[n.key] ?? 0;
      const row = rowsUsed.get(depth) ?? 0;
      rowsUsed.set(depth, row + 1);
      return {
        id: n.key,
        title: n.title.trim() || `Quest ${i + 1}`,
        skillKey: n.skillKey,
        depth,
        row,
        state: n.parents.length || n.requirements.length ? "locked" : "available",
      };
    });
  }, [nodes]);
  const previewEdges = nodes.flatMap((n) => n.parents.map((p) => ({ parent: p, child: n.key })));
  const bonus = nodes.reduce(
    (acc, n) => {
      const r = rewardsFor(n.difficulty);
      return { xp: acc.xp + r.xp, gp: acc.gp + r.gp };
    },
    { xp: 0, gp: 0 },
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await createQuestlineAction({
        title,
        description,
        skillKey,
        nodes: nodes.map((n) => ({
          key: n.key,
          title: n.title,
          skillKey: n.skillKey,
          difficulty: n.difficulty,
          objectives: n.objectives.split("\n"),
          parents: n.parents,
          requirements: n.requirements,
        })),
      });
      if (r.ok) router.push(`/questlines?id=${r.data}`);
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-col gap-4" noValidate>
      <GamePanel as="section" labelledBy={`${ids}-about`} className="p-5">
        <SectionHeader id={`${ids}-about`} icon={<PixelIcon name="questlines" size={22} />} title="The Journey" divider />
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_16rem]">
          <div className="grid gap-3">
            <div>
              <label htmlFor={`${ids}-title`} className={label}>
                Questline name <span className="text-gold-300">*</span>
              </label>
              <input id={`${ids}-title`} className={field} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. MangoStax — The Launch" />
            </div>
            <div>
              <label htmlFor={`${ids}-desc`} className={label}>
                Story <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <textarea id={`${ids}-desc`} className={cx(field, "min-h-16")} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor={`${ids}-skill`} className={label}>
              Bonus Skill
            </label>
            <select id={`${ids}-skill`} className={field} value={skillKey} onChange={(e) => setSkillKey(e.target.value as SkillKey)}>
              {skills.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-text-muted">
              Finishing every Quest awards a bonus of about +{formatNumber(Math.round(bonus.xp * 0.25))} XP and +{Math.round(bonus.gp * 0.25)} GP.
            </p>
          </div>
        </div>
      </GamePanel>

      <GamePanel as="section" labelledBy={`${ids}-preview`} className="p-4">
        <SectionHeader id={`${ids}-preview`} icon={<PixelIcon name="world" size={22} />} title="Adventure Path Preview" divider />
        <div className="mt-3">
          <QuestlineMap nodes={preview} edges={previewEdges} label="Questline preview" />
        </div>
      </GamePanel>

      <ol className="flex flex-col gap-3">
        {nodes.map((n, i) => {
          const earlier = nodes.slice(0, i);
          return (
            <li key={n.key}>
              <GamePanel as="section" aria-label={`Quest ${i + 1}`} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="q-title text-xl text-gold-300">Quest {i + 1}</p>
                  {nodes.length > 1 && (
                    <GameButton variant="ghost" size="sm" className="text-crimson-300 hover:text-crimson-300" onClick={() => removeNode(n.key)}>
                      Remove
                    </GameButton>
                  )}
                </div>
                <div className="mt-2 grid gap-3 md:grid-cols-[1fr_11rem_11rem]">
                  <div>
                    <label className={label} htmlFor={`${n.key}-t`}>
                      Quest name
                    </label>
                    <input id={`${n.key}-t`} className={field} value={n.title} maxLength={120} onChange={(e) => update(n.key, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor={`${n.key}-s`}>
                      Skill
                    </label>
                    <select id={`${n.key}-s`} className={field} value={n.skillKey} onChange={(e) => update(n.key, { skillKey: e.target.value as SkillKey })}>
                      {skills.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor={`${n.key}-d`}>
                      Difficulty
                    </label>
                    <select id={`${n.key}-d`} className={field} value={n.difficulty} onChange={(e) => update(n.key, { difficulty: e.target.value as QuestDifficulty })}>
                      {QUEST_DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {QUEST_DIFFICULTY_LABELS[d]} ({formatNumber(rewardsFor(d).xp)} XP)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={label} htmlFor={`${n.key}-o`}>
                      Objectives <span className="font-normal text-text-muted">(one per line, optional)</span>
                    </label>
                    <textarea id={`${n.key}-o`} className={cx(field, "min-h-20")} value={n.objectives} onChange={(e) => update(n.key, { objectives: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-3">
                    {earlier.length > 0 && (
                      <fieldset>
                        <legend className={label}>Unlocks after</legend>
                        <div className="flex flex-wrap gap-1.5">
                          {earlier.map((p, j) => {
                            const on = n.parents.includes(p.key);
                            return (
                              <label key={p.key} className={cx("flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-1 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring", on ? "border-gold-500 bg-gold-700/25 text-gold-200" : "border-stone-600 text-text-secondary")}>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={on}
                                  onChange={() => update(n.key, { parents: on ? n.parents.filter((x) => x !== p.key) : [...n.parents, p.key] })}
                                />
                                {on && <span aria-hidden>✓</span>}
                                {p.title.trim() || `Quest ${j + 1}`}
                              </label>
                            );
                          })}
                        </div>
                        <p className="mt-1 text-xs text-text-muted">Pick several to make paths merge; leave a branch with the same parent to make it split.</p>
                      </fieldset>
                    )}
                    <RequirementEditor
                      skills={skills}
                      requirements={n.requirements}
                      onChange={(requirements) => update(n.key, { requirements })}
                      idPrefix={n.key}
                    />
                  </div>
                </div>
              </GamePanel>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <GameButton variant="secondary" onClick={addNode} disabled={nodes.length >= 20}>
          + Add Quest
        </GameButton>
        <span className="text-sm text-text-muted">{nodes.length} / 20 Quests</span>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <GameButton type="submit" variant="primary" size="lg" disabled={pending || !title.trim() || nodes.some((n) => !n.title.trim())}>
        {pending ? "Charting…" : "Chart Questline →"}
      </GameButton>
      <p className="text-sm text-text-muted">Quests in a Questline are accepted one by one as they unlock; each one&apos;s rewards are locked in when you accept it.</p>
    </form>
  );
}

function RequirementEditor({
  skills,
  requirements,
  onChange,
  idPrefix,
}: {
  skills: Skill[];
  requirements: RequirementInput[];
  onChange: (r: RequirementInput[]) => void;
  idPrefix: string;
}) {
  const [type, setType] = useState<RequirementType>("SKILL_LEVEL");
  const [ref, setRef] = useState<string>(skills[0].key);
  const [value, setValue] = useState("10");
  const [text, setText] = useState("");
  const describe = (r: RequirementInput) =>
    r.type === "SKILL_LEVEL"
      ? `${skills.find((s) => s.key === r.reference)?.name} Level ${r.requiredValue}`
      : r.type === "QUEST_POINTS"
        ? `${r.requiredValue} Quest Points`
        : r.type === "COMBAT_POINTS"
          ? `${r.requiredValue} Combat Points`
          : r.type === "DATE_REACHED"
            ? `On or after ${r.reference}`
            : r.label;

  function add() {
    const r: RequirementInput =
      type === "SKILL_LEVEL"
        ? { type, reference: ref, requiredValue: Number(value) }
        : type === "DATE_REACHED"
          ? { type, reference: text }
          : type === "MANUAL"
            ? { type, label: text }
            : { type, requiredValue: Number(value) };
    onChange([...requirements, r]);
    setText("");
  }

  return (
    <fieldset>
      <legend className={label}>Requirements <span className="font-normal text-text-muted">(optional)</span></legend>
      {requirements.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1">
          {requirements.map((r, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-text-primary">
              <PixelIcon name="lock" size={12} /> {describe(r)}
              <button type="button" className="ml-auto text-text-muted hover:text-crimson-300" aria-label={`Remove requirement ${describe(r)}`} onClick={() => onChange(requirements.filter((_, j) => j !== i))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-1.5">
        <select aria-label="Requirement type" className={cx(field, "w-auto")} value={type} onChange={(e) => setType(e.target.value as RequirementType)}>
          {REQ_TYPES.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
        {type === "SKILL_LEVEL" && (
          <select aria-label="Skill" className={cx(field, "w-auto")} value={ref} onChange={(e) => setRef(e.target.value)}>
            {skills.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        {(type === "SKILL_LEVEL" || type === "QUEST_POINTS" || type === "COMBAT_POINTS") && (
          <input aria-label={type === "SKILL_LEVEL" ? "Level" : "Points"} type="number" min={1} max={type === "SKILL_LEVEL" ? 99 : 100000} className={cx(field, "w-24")} value={value} onChange={(e) => setValue(e.target.value)} />
        )}
        {type === "DATE_REACHED" && <input aria-label="Date" type="date" className={cx(field, "w-auto")} value={text} onChange={(e) => setText(e.target.value)} />}
        {type === "MANUAL" && <input aria-label="Requirement" className={cx(field, "flex-1")} value={text} maxLength={200} placeholder="e.g. Sponsor brief received" onChange={(e) => setText(e.target.value)} />}
        <GameButton variant="secondary" size="sm" onClick={add} disabled={(type === "MANUAL" || type === "DATE_REACHED") && !text.trim()} id={`${idPrefix}-add-req`}>
          Add
        </GameButton>
      </div>
    </fieldset>
  );
}
