import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MIN_PLINTH_PIECE_MM, planRuns } from "../src/blocks";
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

  it("overlapping doors on the plan: no planks, the guide says the doors overlap", () => {
    const door = (offsetMm: number) =>
      ({ type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 2, offsetMm }] }) as const;
    const layout = plintus.compute({ ...defaults, openings: [door(600), door(1000)] }, ctx).layout;
    expect(layout?.pieces).toEqual([]);
    expect(layout?.guide.map((s) => s.code)).toEqual(["doors_overlap"]);
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
          // A spare plank only when the plan leaves less than a minimum piece.
          const spare = planks(result) - used;
          // No piece under 30 cm cut into a run; a run shorter than that is one piece.
          const short = runs.some((r) => r.pieces.length > 1 && r.pieces.some((p) => p.lengthMm < MIN_PLINTH_PIECE_MM));
          return laid === total && (spare === 0 || spare === 1) && joints === joiners(result) && !short;
        },
      ),
      { numRuns: 300 },
    );
  });

  it("2.51 × 2.49 m: no 1 cm piece — the last pieces are 30 cm, 5 planks (formula review 2026-10-21)", () => {
    const result = plintus.compute({ ...defaults, lengthMm: 2510, widthMm: 2490, openings: [] }, ctx);
    const pieces = result.layout?.runs?.map((r) => r.pieces.map((p) => p.lengthMm)) ?? [];
    expect(pieces).toEqual([
      [2210, 300],
      [2190, 300],
      [2200, 310],
      [2190, 300],
    ]);
    expect(planks(result)).toBe(5);
    expect(joiners(result)).toBe(4);
  });

  it("planRuns: no piece under 30 cm — a short tail takes from the piece before, or the rest is put aside", () => {
    // 2600: 2500 + 100 → 2300 + 300 (planks 1, 2), rest 2200; 2400: 2200 + 200 → the rest cut to 2100 + 300 from
    // plank 3, rest 2200; 2350: 2200 + 150 → 2050 + 300 from plank 4, rest 2200.
    const plan = planRuns([2600, 2400, 2350], 2500);
    expect(plan.runs.map((r) => r.pieces.map((p) => p.lengthMm))).toEqual([
      [2300, 300],
      [2100, 300],
      [2050, 300],
    ]);
    expect(plan).toMatchObject({ planks: 4, joints: 3, leftoverMm: 2200 });
    // A 400 rest meets a 600 run: 400 + 200 → 100 + 500 would leave a 10 cm piece; 400 − 100 = 300 + 300.
    const short = planRuns([2100, 600], 2500);
    expect(short.runs[1]?.pieces.map((p) => p.lengthMm)).toEqual([300, 300]);
    // A 350 rest meets a 500 run: 350 − 150 = 200 < 30 cm, so the rest is put aside and a new plank covers the run.
    const aside = planRuns([2150, 500], 2500);
    expect(aside.runs[1]?.pieces).toEqual([{ lengthMm: 500, plank: 2, from: "cut" }]);
    expect(aside.leftoverMm).toBe(2000);
    // A run shorter than the minimum is one piece.
    expect(planRuns([200], 2500).runs[0]?.pieces).toEqual([{ lengthMm: 200, plank: 1, from: "cut" }]);
  });
});
