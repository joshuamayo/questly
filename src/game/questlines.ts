/**
 * Questline rules (pure): dependency graphs, unlocking, layout, and the
 * completion bonus. Questlines are adventure paths, not folders.
 */

import { QUESTLINE_BONUS } from "./config/balance";
import { GameRuleError } from "./errors";

export type Edge = { parent: string; child: string };

/** Throws if the edges contain a cycle or reference unknown nodes. */
export function assertAcyclic(nodeIds: readonly string[], edges: readonly Edge[]): void {
  const ids = new Set(nodeIds);
  for (const e of edges) {
    if (!ids.has(e.parent) || !ids.has(e.child)) throw new GameRuleError("A dependency points to an unknown Quest.", "BAD_DEPENDENCY");
    if (e.parent === e.child) throw new GameRuleError("A Quest cannot depend on itself.", "BAD_DEPENDENCY");
  }
  const children = new Map<string, string[]>();
  for (const e of edges) children.set(e.parent, [...(children.get(e.parent) ?? []), e.child]);
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (n: string) => {
    if (state.get(n) === 1) throw new GameRuleError("These dependencies would form a loop.", "DEPENDENCY_CYCLE");
    if (state.get(n) === 2) return;
    state.set(n, 1);
    for (const c of children.get(n) ?? []) visit(c);
    state.set(n, 2);
  };
  for (const n of nodeIds) visit(n);
}

/** A node unlocks when every parent is complete (nodes without parents start unlocked). */
export function isUnlocked(nodeId: string, edges: readonly Edge[], completed: ReadonlySet<string>): boolean {
  return edges.filter((e) => e.child === nodeId).every((e) => completed.has(e.parent));
}

/** Column index per node: the longest path from any root (for the adventure-path map). */
export function layoutDepths(nodeIds: readonly string[], edges: readonly Edge[]): Record<string, number> {
  const depth: Record<string, number> = Object.fromEntries(nodeIds.map((n) => [n, 0]));
  for (let i = 0; i < nodeIds.length; i++) {
    let changed = false;
    for (const e of edges) {
      if (depth[e.child] < depth[e.parent] + 1) {
        depth[e.child] = depth[e.parent] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return depth;
}

export function questlineBonus(
  questRewards: readonly { xp: number; gp: number }[],
  config: { xpShare: number; gpShare: number } = QUESTLINE_BONUS,
): { xp: number; gp: number } {
  const xp = questRewards.reduce((s, r) => s + r.xp, 0);
  const gp = questRewards.reduce((s, r) => s + r.gp, 0);
  return { xp: Math.round(xp * config.xpShare), gp: Math.round(gp * config.gpShare) };
}
