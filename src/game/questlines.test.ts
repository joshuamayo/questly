import { describe, expect, it } from "vitest";
import { assertAcyclic, isUnlocked, layoutDepths, questlineBonus } from "./questlines";

// Brand → Storefront → First Product → Launch, with Payment Setup branching from Storefront.
const nodes = ["brand", "store", "product", "payment", "launch"];
const edges = [
  { parent: "brand", child: "store" },
  { parent: "store", child: "product" },
  { parent: "store", child: "payment" },
  { parent: "product", child: "launch" },
  { parent: "payment", child: "launch" },
];

describe("Questline graphs", () => {
  it("accepts ordered and branching paths", () => {
    expect(() => assertAcyclic(nodes, edges)).not.toThrow();
  });

  it("rejects loops and unknown nodes", () => {
    expect(() => assertAcyclic(nodes, [...edges, { parent: "launch", child: "brand" }])).toThrow(/loop/);
    expect(() => assertAcyclic(nodes, [{ parent: "brand", child: "ghost" }])).toThrow(/unknown/);
  });

  it("unlocks a node only when every parent is complete", () => {
    expect(isUnlocked("brand", edges, new Set())).toBe(true);
    expect(isUnlocked("launch", edges, new Set(["brand", "store", "product"]))).toBe(false);
    expect(isUnlocked("launch", edges, new Set(["brand", "store", "product", "payment"]))).toBe(true);
  });

  it("lays nodes out by longest path depth", () => {
    expect(layoutDepths(nodes, edges)).toEqual({ brand: 0, store: 1, product: 2, payment: 2, launch: 3 });
  });

  it("computes the completion bonus from member rewards", () => {
    expect(questlineBonus([{ xp: 750, gp: 15 }, { xp: 2000, gp: 40 }])).toEqual({ xp: 688, gp: 14 });
  });
});
