"use client";

import { useState } from "react";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { GamePanel } from "@/components/ui/GamePanel";
import { LocalDate } from "@/components/ui/LocalDate";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatNumber } from "@/lib/format";
import { cx } from "@/lib/cx";
import type { SkillSheet, XpEntry } from "@/server/queries/character-sheet";
import { NextUnlock, SkillHero, SkillMilestones, SkillRecord } from "./SkillPanels";
import { skillColor } from "./skill-style";

/**
 * Skills screen body. Selection is mirrored to `?skill=` so it is linkable.
 * All numbers come from the server read model (engine output).
 */
export function SkillsBoard({
  skills,
  initialKey,
  totalLevel,
  maxTotalLevel,
  recentXp,
  sceneUrls,
}: {
  skills: SkillSheet[];
  initialKey?: string;
  totalLevel: number;
  maxTotalLevel: number;
  recentXp: XpEntry[];
  sceneUrls: Record<string, string | null>;
}) {
  const [selectedKey, setSelectedKey] = useState(
    skills.some((s) => s.key === initialKey) ? initialKey! : skills[0].key,
  );
  const selected = skills.find((s) => s.key === selectedKey) ?? skills[0];
  const nameOf = (key: string) => skills.find((s) => s.key === key)?.name ?? key;

  function select(key: string) {
    setSelectedKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set("skill", key);
    window.history.replaceState(null, "", url);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("skill-detail")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
      {/* Right column first on small screens: the skill picker. */}
      <div className="flex flex-col gap-4 xl:col-start-2 xl:row-start-1">
        <GamePanel as="section" labelledBy="all-skills" className="p-4">
          <SectionHeader id="all-skills" icon={<PixelIcon name="skills" size={22} />} title="All Skills" divider />
          <ul className="mt-3 grid grid-cols-3 gap-2" aria-label="Choose a Skill">
            {skills.map((skill) => {
              const active = skill.key === selected.key;
              return (
                <li key={skill.key}>
                  <button
                    type="button"
                    onClick={() => select(skill.key)}
                    aria-pressed={active}
                    aria-controls="skill-detail"
                    className={cx(
                      "q-tile flex w-full flex-col items-center gap-1 px-1.5 pb-2 pt-2.5 transition-[box-shadow,border-color] duration-[var(--duration-fast)]",
                      active ? "border-gold-400 shadow-glow-gold" : "hover:border-stone-500",
                    )}
                  >
                    <SkillIcon icon={skill.icon} size={32} framed={false} />
                    <span className="q-title text-2xl leading-none text-text-primary">
                      <span className="sr-only">Level </span>
                      {skill.progress.level}
                    </span>
                    <span className="text-sm text-text-secondary">{skill.name}</span>
                    <ProgressBar
                      size="sm"
                      className="w-full"
                      color={skillColor(skill.key)}
                      value={skill.progress.percentToNext}
                      label={`${skill.name} progress`}
                      valueText={`${skill.progress.percentToNext}% to next level`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="q-tile mt-3 px-3 py-2.5 text-center">
            <p className="text-lg text-text-primary">
              Total Level: <span className="font-bold">{totalLevel}</span>
              <span className="text-text-muted"> / {maxTotalLevel}</span>
            </p>
            <ProgressBar
              tone="gold"
              className="mt-1"
              value={(totalLevel / maxTotalLevel) * 100}
              label="Total Level toward maximum"
              valueText={`${totalLevel} of ${maxTotalLevel}`}
            />
          </div>
        </GamePanel>

        <GamePanel as="section" labelledBy="recent-xp" className="hidden p-4 xl:block">
          <SectionHeader id="recent-xp" icon={<PixelIcon name="quests" size={22} />} title="Recent Skill XP" divider />
          {recentXp.length === 0 ? (
            <p className="mt-3 text-text-secondary">No XP earned yet. Complete Quests to start training.</p>
          ) : (
            <ul className="mt-1">
              {recentXp.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5 border-b border-stone-800 py-2 last:border-0">
                  <SkillIcon icon={`skill-${e.skillKey}`} size={18} framed={false} label={nameOf(e.skillKey)} />
                  <span className="w-20 shrink-0 font-bold tabular-nums text-text-primary">+{formatNumber(e.amount)} XP</span>
                  <span className="flex-1 truncate text-sm text-text-secondary">{e.source}</span>
                  <span className="shrink-0 text-xs text-text-muted">
                    <LocalDate iso={e.createdAt} options={{ month: "short", day: "numeric" }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GamePanel>
      </div>

      <div id="skill-detail" className="flex scroll-mt-20 flex-col gap-4 xl:col-start-1 xl:row-start-1" aria-live="polite">
        <SkillHero skill={selected} sceneUrl={sceneUrls[selected.key] ?? null} />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkillMilestones skill={selected} />
          <div className="flex flex-col gap-4">
            <SkillRecord skill={selected} />
            <NextUnlock skill={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
