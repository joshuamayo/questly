import type { QuestlineNode } from "@/server/queries/questlines";

export type NodeState = "completed" | "active" | "available" | "locked" | "abandoned";

/** Display state of a Questline node (shared by server and client components). */
export function nodeState(n: Pick<QuestlineNode, "status" | "locked">): NodeState {
  if (n.status === "COMPLETED") return "completed";
  if (n.status === "ABANDONED") return "abandoned";
  if (n.status === "AVAILABLE") return n.locked ? "locked" : "available";
  return "active";
}
