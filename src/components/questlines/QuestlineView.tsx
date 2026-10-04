"use client";

import Link from "next/link";
import { useState } from "react";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { DifficultyBadge } from "@/components/quests/DifficultyBadge";
import { RewardTiles } from "@/components/quests/RewardTiles";
import { skillColor } from "@/components/skills/skill-style";
import { Badge } from "@/components/ui/Badge";
import { GameLinkButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatNumber } from "@/lib/format";
import type { QuestlineDetail } from "@/server/queries/questlines";
import { nodeState } from "./node-state";
import { QuestlineMap, type MapNode } from "./QuestlineMap";


/** Questline map + selected node details + node list. */
export function QuestlineView({ line, skillNames }: { line: QuestlineDetail; skillNames: Record<string, string> }) {
  const [selectedId, setSelectedId] = useState(line.currentNodeId ?? line.nodes[0]?.id ?? null);
  const selected = line.nodes.find((n) => n.id === selectedId) ?? null;
  const mapNodes: MapNode[] = line.nodes.map((n) => ({
    id: n.id,
    title: n.title,
    skillKey: n.skillKey,
    depth: n.depth,
    row: n.row,
    state: nodeState(n),
    isBoss: n.isBoss,
  }));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <GamePanel as="section" surface="parchment" labelledBy="ql-title" className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <h2 id="ql-title" className="q-title text-display-md leading-tight text-parchment-ink">
              {line.title}
            </h2>
            {line.description && <p className="mt-1 text-parchment-ink">{line.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="parchment">{line.skillName}</Badge>
              <Badge tone={line.status === "COMPLETED" ? "moss" : "parchment"}>
                {line.status === "COMPLETED" ? "Questline Complete" : line.status === "ARCHIVED" ? "Archived" : "Active Questline"}
              </Badge>
              <span className="text-sm font-bold text-parchment-ink-soft">
                Completion bonus: +{formatNumber(line.bonus.xp)} {line.skillName} XP · +{line.bonus.gp} GP
              </span>
            </div>
          </div>
          <div className="w-full rounded-sm border border-parchment-400/70 bg-parchment-50/40 p-3 md:w-64">
            <p className="q-title text-lg text-parchment-ink">Overall Progress</p>
            <ProgressBar
              className="mt-1"
              tone="moss"
              value={line.percent}
              label="Questline progress"
              valueText={`${line.completed} of ${line.total} Quests complete`}
            />
            <p className="mt-1 text-sm font-bold text-parchment-ink">
              {line.completed} / {line.total} ({line.percent}%)
            </p>
          </div>
        </div>
      </GamePanel>

      <GamePanel as="section" labelledBy="ql-map" className="p-4">
        <SectionHeader id="ql-map" icon={<PixelIcon name="questlines" size={22} />} title="Adventure Path" divider />
        <div className="mt-3">
          <QuestlineMap nodes={mapNodes} edges={line.edges} selectedId={selectedId} onSelect={setSelectedId} label={`${line.title} adventure path`} />
        </div>
      </GamePanel>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {selected && (
          <GamePanel as="section" labelledBy="ql-node" className="p-4" aria-live="polite">
            <div className="flex items-start gap-3">
              <SkillIcon icon={`skill-${selected.skillKey}`} size={40} />
              <div className="min-w-0 flex-1">
                <h3 id="ql-node" className="q-title text-2xl leading-tight text-gold-300">
                  {selected.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={selected.difficulty} />
                  <span className="text-sm" style={{ color: skillColor(selected.skillKey) }}>
                    {skillNames[selected.skillKey]}
                  </span>
                  <Badge tone="stone">{nodeState(selected) === "active" ? "Active" : nodeState(selected).replace(/^./, (c) => c.toUpperCase())}</Badge>
                </div>
              </div>
            </div>
            {selected.description && <p className="mt-2 text-text-secondary">{selected.description}</p>}
            {selected.lock && (selected.lock.dependencies.length > 0 || selected.lock.requirements.length > 0) && (
              <>
                <p className="mt-3 text-sm font-bold text-gold-300">Requirements</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm">
                  {selected.lock.dependencies.map((d) => (
                    <li key={d.questId} className="flex gap-2">
                      <span aria-hidden className={d.met ? "text-moss-300" : "text-text-muted"}>{d.met ? "✓" : "○"}</span>
                      <span className={d.met ? "text-text-secondary" : "text-text-primary"}>Complete {d.title}</span>
                      <span className="sr-only">{d.met ? "(met)" : "(not met)"}</span>
                    </li>
                  ))}
                  {selected.lock.requirements.map((r) => (
                    <li key={r.id} className="flex gap-2">
                      <span aria-hidden className={r.met ? "text-moss-300" : "text-text-muted"}>{r.met ? "✓" : "○"}</span>
                      <span className={r.met ? "text-text-secondary" : "text-text-primary"}>{r.description}</span>
                      {r.type !== "MANUAL" && <span className="text-text-muted">(you have {r.current})</span>}
                      <span className="sr-only">{r.met ? "(met)" : "(not met)"}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-3 text-sm font-bold text-gold-300">Rewards</p>
            <RewardTiles className="mt-1" rewards={selected.rewards} skillKey={selected.skillKey} skillName={skillNames[selected.skillKey] ?? ""} earned={selected.status === "COMPLETED"} />
            {selected.status === "AVAILABLE" && !selected.locked && (
              <p className="mt-2 text-xs text-text-muted">Shown at today&apos;s rates; locked in when you accept.</p>
            )}
            <GameLinkButton href={`/quests/${selected.id}`} variant={nodeState(selected) === "locked" ? "secondary" : "primary"} className="mt-4 w-full">
              {nodeState(selected) === "available"
                ? "View & Accept Quest →"
                : nodeState(selected) === "active"
                  ? "Continue Quest →"
                  : nodeState(selected) === "locked"
                    ? "View Requirements"
                    : "View Quest"}
            </GameLinkButton>
          </GamePanel>
        )}

        <GamePanel as="section" labelledBy="ql-quests" className="p-4">
          <SectionHeader id="ql-quests" icon={<PixelIcon name="quests" size={22} />} title="Questline Quests" divider action={<span className="text-sm text-text-secondary">{line.completed} / {line.total}</span>} />
          <ol className="mt-2 flex flex-col gap-1.5">
            {line.nodes.map((n, i) => {
              const st = nodeState(n);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(n.id)}
                    aria-pressed={n.id === selectedId}
                    className="q-tile flex w-full items-center gap-2 px-2.5 py-2 text-left hover:border-stone-500 aria-pressed:border-gold-500"
                  >
                    <span className="w-5 text-sm tabular-nums text-text-muted">{i + 1}</span>
                    <span className="flex-1 truncate text-text-primary">{n.title}</span>
                    <span
                      className={
                        st === "completed" ? "text-xs font-bold text-moss-300" : st === "active" ? "text-xs font-bold text-blue-300" : st === "available" ? "text-xs font-bold text-gold-300" : "flex items-center gap-1 text-xs text-text-muted"
                      }
                    >
                      {st === "locked" && <PixelIcon name="lock" size={12} />}
                      {st === "completed" ? "✓ Complete" : st[0].toUpperCase() + st.slice(1)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <Link href="/quests" className="mt-3 inline-block text-sm text-blue-300 hover:underline">
            Open Quest Journal →
          </Link>
        </GamePanel>
      </div>
    </div>
  );
}
