import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { plintus } from "../src/tools/plintus";

const ctx = { country: "RU" } as const;
const defaults = plintus.defaults(ctx);
const planks = (r: ReturnType<typeof plintus.compute>) => r.items.find((i) => i.key === "plinth")?.packs ?? 0;
const joiners = (r: ReturnType<typeof plintus.compute>) => r.items.find((i) => i.key === "plinth-joiner")?.packs ?? 0;

describe("plinth scheme", () => {
  it("example room: runs from the longest wall clockwise, split at the door, planks as bought", () => {
    const result = plintus.compute(defaults, ctx);
    const layout = result.layout;
    if (!layout?.runs) throw new Error("no runs");
    expect(layout.kind).toBe("outline");
    // Walls 4.6, 4.3, then the bottom wall split by the door (0.6 + 3.2), then 4.3.
    expect(layout.runs.map((r) => [r.wall, r.lengthMm])).toEqual([
      [0, 4600],
      [1, 4300],
      [2, 600],
      [2, 3200],
      [3, 4300],
    ]);
    expect(Math.max(...layout.runs.flatMap((r) => r.pieces.map((p) => p.plank)))).toBe(planks(result));
    expect(layout.marks.filter((m) => m.kind === "seam")).toHaveLength(joiners(result));
    expect(layout.guide.map((s) => s.code)).toEqual(["start", "carry", "corners", "caps", "joints", "fasteners"]);
  });

  it("an unplaced door: the plan without planks and a request to place the doors", () => {
    const door = { type: "door", widthMm: 800, heightMm: 2000, count: 1 } as const;
    const layout = plintus.compute({ ...defaults, openings: [door] }, ctx).layout;
    expect(layout?.pieces).toEqual([]);
    expect(layout?.guide.map((s) => s.code)).toEqual(["place_doors"]);
  });

  it("whatever the room, plank and placed doors: the scheme lays exactly the planks bought", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1500, max: 12_000 }),
        fc.integer({ min: 1500, max: 12_000 }),
        fc.constantFrom(2000, 2200, 2500, 3000),
        fc.array(fc.tuple(fc.integer({ min: 0, max: 3 }), fc.integer({ min: 500, max: 640 })), { maxLength: 3 }),
        fc.boolean(),
        fc.constantFrom("ne", "se", "sw", "nw" as const),
        (lengthMm, widthMm, plankLengthMm, doorSpecs, l, cutCorner) => {
          // One door per wall at most, 100 mm from its corner: never overlapping, fits the shortest wall (750 mm).
          const seen = new Set<number>();
          const openings = doorSpecs
            .filter(([wall]) => !seen.has(wall) && seen.add(wall))
            .map(([wall, widthMm]) => ({
              type: "door" as const,
              widthMm,
              heightMm: 2000,
              count: 1,
              places: [{ wall, offsetMm: 100 }],
            }));
          const input = {
            ...defaults,
            lengthMm,
            widthMm,
            plankLengthMm,
            openings,
            shape: l ? ("l" as const) : ("rect" as const),
            cutLengthMm: Math.round(lengthMm / 2),
            cutWidthMm: Math.round(widthMm / 2),
            cutCorner,
          };
          const result = plintus.compute(input, ctx);
          const runs = result.layout?.runs ?? [];
          if (runs.length === 0) return false;
          const laid = runs.reduce((sum, r) => sum + r.pieces.reduce((s, p) => s + p.lengthMm, 0), 0);
          const total = runs.reduce((sum, r) => sum + r.lengthMm, 0);
          const used = Math.max(...runs.flatMap((r) => r.pieces.map((p) => p.plank)));
          const joints = result.layout?.marks.filter((m) => m.kind === "seam").length ?? 0;
          return laid === total && used === planks(result) && joints <= joiners(result);
        },
      ),
      { numRuns: 300 },
    );
  });
});
