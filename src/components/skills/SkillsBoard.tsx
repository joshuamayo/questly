"use client";

import { useRef, useState } from "react";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatNumber } from "@/lib/format";
import { cx } from "@/lib/cx";
import type { SkillSheet } from "@/server/queries/character-sheet";
import { SkillDetail } from "./SkillDetail";

/**
 * Skill grid + mastery pane. Selection is mirrored to `?skill=` so it is
 * linkable; on narrow screens selecting a Skill scrolls its detail into view.
 */
export function SkillsBoard({
  skills,
  initialKey,
  footer,
}: {
  skills: SkillSheet[];
  initialKey?: string;
  footer?: React.ReactNode;
}) {
  const [selectedKey, setSelectedKey] = useState(
    skills.some((s) => s.key === initialKey) ? initialKey! : skills[0].key,
  );
  const detailRef = useRef<HTMLDivElement>(null);
  const selected = skills.find((s) => s.key === selectedKey) ?? skills[0];

  function select(key: string) {
    setSelectedKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set("skill", key);
    window.history.replaceState(null, "", url);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      detailRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_26rem] lg:grid-rows-[auto_1fr]">
      <ul className="grid gap-3 lg:col-start-1 lg:row-start-1 sm:grid-cols-2 2xl:grid-cols-3" aria-label="Skills">
        {skills.map((skill) => {
          const p = skill.progress;
          const active = skill.key === selected.key;
          return (
            <li key={skill.key}>
              <button
                type="button"
                onClick={() => select(skill.key)}
                aria-pressed={active}
                aria-controls="skill-detail"
                className={cx(
                  "q-stone group relative flex w-full flex-col gap-3 rounded-md border-2 p-4 text-left",
                  "transition-[box-shadow,transform] duration-[var(--duration-fast)] hover:-translate-y-0.5",
                  active
                    ? "border-gold-500 shadow-glow-gold"
                    : "border-border-dark shadow-[inset_0_0_0_1px_rgb(217_164_65/0.18),var(--shadow-raised)] hover:border-timber-600",
                )}
              >
                <div className="flex items-center gap-3">
                  <SkillIcon icon={skill.icon} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="q-display truncate text-lg text-text-primary">{skill.name}</p>
                    <p className="truncate text-xs text-text-muted">{skill.motto}</p>
                  </div>
                  <div className="shrink-0 pl-1 text-right">
                    <p className="q-display text-3xl leading-none tabular-nums text-gold-200">
                      <span className="sr-only">Level </span>
                      {p.level}
                    </p>
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">/ 99</p>
                  </div>
                </div>
                <ProgressBar
                  tone={skill.key === "focus" ? "teal" : "moss"}
                  value={p.percentToNext}
                  label={`${skill.name} progress`}
                  valueText={p.isMaxLevel ? "Maximum level" : `${formatNumber(p.xpRemaining)} XP to Level ${p.level + 1}`}
                />
                <div className="flex justify-between text-xs">
                  <span className="tabular-nums text-text-secondary">{formatNumber(p.totalXp)} XP</span>
                  <span className="text-text-muted">
                    {p.isMaxLevel ? "Mastered" : `${formatNumber(p.xpRemaining)} to Lv ${p.level + 1}`}
                  </span>
                </div>
                {active && (
                  <span className="absolute right-2 top-2 text-[0.6rem] font-bold uppercase tracking-wider text-gold-300">
                    Selected
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div ref={detailRef} className="lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-live="polite">
        <SkillDetail skill={selected} id="skill-detail" />
      </div>
      {footer && <div className="lg:col-start-1 lg:row-start-2">{footer}</div>}
    </div>
  );
}
