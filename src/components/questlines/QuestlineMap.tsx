"use client";

import { PixelIcon } from "@/components/icons/PixelIcon";
import { SkillIcon } from "@/components/icons/SkillIcon";
import { cx } from "@/lib/cx";

export type MapNode = {
  id: string;
  title: string;
  skillKey: string;
  depth: number;
  row: number;
  state: "completed" | "active" | "available" | "locked" | "abandoned";
  isBoss?: boolean;
};

const COL = 230;
const ROW = 112;
const W = 190;
const H = 84;
const PAD = 16;

const STATE_LABEL: Record<MapNode["state"], string> = {
  completed: "Complete",
  active: "Active",
  available: "Available",
  locked: "Locked",
  abandoned: "Abandoned",
};

/**
 * Adventure-path map: columns by dependency depth, connectors from parents to
 * children. Every node is a button with its state in text (not only color).
 */
export function QuestlineMap({
  nodes,
  edges,
  selectedId,
  onSelect,
  label,
}: {
  nodes: MapNode[];
  edges: { parent: string; child: string }[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  label: string;
}) {
  const cols = Math.max(1, ...nodes.map((n) => n.depth + 1));
  const rows = Math.max(1, ...nodes.map((n) => n.row + 1));
  const width = cols * COL - (COL - W) + PAD * 2;
  const height = rows * ROW - (ROW - H) + PAD * 2;
  const pos = new Map(nodes.map((n) => [n.id, { x: PAD + n.depth * COL, y: PAD + n.row * ROW }]));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="overflow-x-auto" role="group" aria-label={label}>
      <div className="relative" style={{ width, height, minWidth: "100%" }}>
        <svg aria-hidden className="absolute inset-0" width={width} height={height}>
          {edges.map((e) => {
            const a = pos.get(e.parent);
            const b = pos.get(e.child);
            if (!a || !b) return null;
            const x1 = a.x + W;
            const y1 = a.y + H / 2;
            const x2 = b.x;
            const y2 = b.y + H / 2;
            const mid = (x1 + x2) / 2;
            const done = byId.get(e.parent)?.state === "completed";
            return (
              <path
                key={`${e.parent}-${e.child}`}
                d={`M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                fill="none"
                strokeWidth={done ? 3 : 2}
                strokeDasharray={done ? undefined : "6 6"}
                style={{ stroke: done ? "var(--color-gold-400)" : "var(--color-stone-500)" }}
              />
            );
          })}
        </svg>
        {nodes.map((n) => {
          const p = pos.get(n.id)!;
          const selected = n.id === selectedId;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect?.(n.id)}
              aria-pressed={onSelect ? selected : undefined}
              aria-label={`${n.title}: ${STATE_LABEL[n.state]}${n.isBoss ? ", Boss" : ""}`}
              className={cx(
                "absolute flex items-center gap-2 rounded-sm border-2 px-2.5 text-left transition-[box-shadow,border-color]",
                n.state === "completed" && "border-moss-500 bg-moss-700/40",
                n.state === "active" && "border-blue-400 bg-blue-700/50 shadow-[0_0_14px_rgb(92_156_236/0.35)]",
                n.state === "available" && "border-gold-500 bg-stone-850",
                n.state === "locked" && "border-stone-600 bg-stone-950/80",
                n.state === "abandoned" && "border-crimson-500/60 bg-stone-950/80",
                selected && "ring-2 ring-gold-200 ring-offset-2 ring-offset-stone-900",
              )}
              style={{ left: p.x, top: p.y, width: W, height: H }}
            >
              <span className={cx("shrink-0", n.state === "locked" && "opacity-50 grayscale")}>
                {n.state === "locked" ? <PixelIcon name="lock" size={28} /> : <SkillIcon icon={`skill-${n.skillKey}`} size={28} framed={false} />}
              </span>
              <span className="min-w-0">
                <span className={cx("line-clamp-2 text-sm font-bold leading-tight", n.state === "locked" ? "text-text-muted" : "text-text-primary")}>
                  {n.title}
                </span>
                <span
                  className={cx(
                    "mt-0.5 flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider",
                    n.state === "completed" ? "text-moss-300" : n.state === "active" ? "text-blue-300" : n.state === "available" ? "text-gold-300" : "text-text-muted",
                  )}
                >
                  {n.state === "completed" && <span aria-hidden>✓</span>}
                  {n.isBoss && <PixelIcon name="bosses" size={12} />}
                  {STATE_LABEL[n.state]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
