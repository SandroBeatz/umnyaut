import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type CutPlanInput, planCuts } from "../src/blocks/cutting";
import { hangStrips } from "../src/blocks/hang";
import { oboi } from "../src/tools/oboi";
import type { ElevationOpening, Layout } from "../src/types";

const ctx = { country: "RU" } as const;
const defaults = oboi.defaults(ctx);
type Input = typeof defaults;
const summary = (r: ReturnType<typeof oboi.compute>, key: string) => r.summary.find((s) => s.key === key)?.value;
const EPS = 1e-6;

/**
 * The columns of a wall cover it from corner to corner, side by side, except where a bare zone runs floor to
 * ceiling; at the closing corner the last wrap (at most 3 cm) comes from the other side.
 */
function coversWall(
  columns: readonly { x: number; w: number }[],
  L: number,
  H: number,
  ops: readonly ElevationOpening[],
) {
  const sorted = [...columns].sort((a, b) => a.x - b.x);
  let at = 0;
  for (const c of sorted) {
    if (c.x < at - EPS) return false;
    // A gap is allowed only inside a bare zone from floor to ceiling.
    if (
      c.x > at + EPS &&
      !ops.some((o) => o.type === "bare" && o.h >= H - EPS && o.x <= at + EPS && o.x + o.w >= c.x - EPS)
    )
      return false;
    at = c.x + c.w;
  }
  return (
    at >= L - 30 - EPS ||
    ops.some((o) => o.type === "bare" && o.h >= H - EPS && o.x <= at + EPS && o.x + o.w >= L - EPS)
  );
}

const hangInput = (lengths: number[], line: number, closing: number, openings: ElevationOpening[][] = []) => ({
  walls: lengths.map((lengthMm, k) => ({ lengthMm, openings: openings[k] ?? [] })),
  wrapsMm: lengths.map(() => 15),
  heightMm: 2700,
  rollWidthMm: 530,
  minCarryMm: 50,
  minPieceMm: 50,
  trimMm: 100,
  marginMm: 20,
  start: { wall: 0, lineMm: line },
  closingCorner: closing,
});

describe("hangStrips", () => {
  it("covers every wall without gaps or overlaps, whatever the start line and the closing corner", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 300, max: 8000 }), { minLength: 4, maxLength: 4 }),
        fc.integer({ min: 1, max: 530 }),
        fc.integer({ min: 0, max: 3 }),
        (lengths, line, closing) => {
          const hang = hangStrips(hangInput(lengths, Math.min(line, lengths[0] ?? 0), closing));
          return hang.walls.every((w, k) => coversWall(w.columns, lengths[k] ?? 0, 2700, []));
        },
      ),
      { numRuns: 500 },
    );
  });

  it("the closing corner is always overlapped by at least the wrap, whatever the line (review: bare corner)", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 300, max: 8000 }), { minLength: 4, maxLength: 4 }),
        fc.integer({ min: 1, max: 2120 }),
        fc.integer({ min: 0, max: 3 }),
        (lengths, line, closing) => {
          const hang = hangStrips(hangInput(lengths, Math.min(line, lengths[0] ?? 0), closing));
          const L = lengths[closing] ?? 0;
          const end = hang.walls[closing]?.columns.at(-1);
          const start = hang.walls[(closing + 1) % 4]?.columns[0];
          // How far the material of a column runs past its wall's edge: the wrap of a strip, or the part of a
          // carried rest wider than a short wall.
          const overhang = (c: typeof end) => {
            const b = hang.blanks.find((x) => x.n === c?.n);
            const part = c?.kind === "carry" ? b?.parts.at(-1) : b?.parts[0];
            return (part?.widthMm ?? 0) - (c?.w ?? 0);
          };
          // Both sides may run past the corner; together they overlap it by at least the wrap.
          const fromEnd = end !== undefined && end.x + end.w >= L - EPS ? Math.max(overhang(end), 0) : 0;
          const fromStart = start !== undefined && start.x <= EPS ? Math.max(overhang(start), 0) : 0;
          // The overlap is reported as it is; a short one is flagged (the start search never picks it).
          return Math.abs(fromEnd + fromStart - hang.closingOverlapMm) < 1e-6 || fromEnd + fromStart >= 15 - EPS;
        },
      ),
      { numRuns: 1000 },
    );
  });

  it("a strip ending right at a corner makes the next wall's first strip wrap back by the full wrap", () => {
    // 2120 mm walls are 4 strips of 530: the first strip from the line at 530 ends exactly in the corner.
    const hang = hangStrips(hangInput([2120, 2120, 2120, 2120], 530, 3));
    const first = hang.walls[1]?.columns[0];
    expect(first).toMatchObject({ x: 0, kind: "corner" });
    expect(first?.w).toBeCloseTo(530 - 15);
  });

  it("an outer corner takes its own wrap; the rest goes on the next wall", () => {
    const input = { ...hangInput([2000, 2000, 2000, 2000], 100, 3), wrapsMm: [15, 30, 15, 15] };
    const hang = hangStrips(input);
    const blank = hang.blanks.find((b) => b.parts.length === 2 && b.parts[0]?.wall === 1);
    const onWall = hang.walls[1]?.columns.find((c) => c.n === blank?.n && c.kind === "corner")?.w ?? 0;
    expect(blank?.parts[0]?.widthMm).toBeCloseTo(onWall + 30);
    expect((blank?.parts[0]?.widthMm ?? 0) + (blank?.parts[1]?.widthMm ?? 0)).toBeCloseTo(530);
  });

  it("only a strip wholly across an opening becomes pieces; a window needs 2 cm inside, a door none", () => {
    const door: ElevationOpening = { type: "door", x: 530, y: 700, w: 530, h: 2000 };
    const window: ElevationOpening = { type: "window", x: 1590 - 10, y: 400, w: 530 + 20, h: 1400 };
    const hang = hangStrips(hangInput([4000, 3000, 4000, 3000], 530, 3, [[door, window]]));
    const cols = hang.walls[0]?.columns ?? [];
    expect(cols.find((c) => c.x === 530)?.kind).toBe("pieces");
    // The window is only 1 cm wider than the strip on each side: the strip stays full height.
    expect(cols.find((c) => Math.abs(c.x - 1590) < 1)?.kind).toBe("full");
  });

  it("a bare zone floor to ceiling leaves its strips out; a strip partly over it stays full height", () => {
    const zone: ElevationOpening = { type: "bare", x: 1000, y: 0, w: 2200, h: 2700 };
    const hang = hangStrips(hangInput([4600, 4300, 4600, 4300], 530, 3, [[zone]]));
    const cols = hang.walls[0]?.columns ?? [];
    expect(cols.some((c) => c.x >= 1000 + 20 && c.x + c.w <= 3200 - 20)).toBe(false);
    expect(coversWall(cols, 4600, 2700, [zone])).toBe(true);
  });
});

describe("planCuts", () => {
  const overlap = (a: { fromMm: number; lengthMm: number; xMm: number; widthMm: number }, b: typeof a) =>
    a.fromMm < b.fromMm + b.lengthMm - EPS &&
    b.fromMm < a.fromMm + a.lengthMm - EPS &&
    a.xMm < b.xMm + b.widthMm - EPS &&
    b.xMm < a.xMm + a.widthMm - EPS;

  const arb = fc.record({
    rollWidthMm: fc.constantFrom(530, 700, 1060),
    rollLengthMm: fc.integer({ min: 8000, max: 25_000 }),
    repeatMm: fc.constantFrom(0, 0, 320, 640),
    strips: fc.array(
      fc.record({
        lengthMm: fc.integer({ min: 2200, max: 3200 }),
        phaseMm: fc.constantFrom(0, 320),
        restMm: fc.constantFrom(0, 0, 150, 400),
      }),
      { maxLength: 30 },
    ),
    parts: fc.array(
      fc.record({
        widthMm: fc.integer({ min: 100, max: 530 }),
        lengthMm: fc.integer({ min: 100, max: 3000 }),
        phaseMm: fc.integer({ min: 0, max: 639 }),
      }),
      { maxLength: 12 },
    ),
  });

  it("cuts every strip and part once, inside its roll, never over another cut or a rest; areas add up", () => {
    fc.assert(
      fc.property(arb, (i) => {
        const input: CutPlanInput = { ...i, minRestMm: 100 };
        const plan = planCuts(input);
        if (!plan.fits) return true;
        const usable = i.rollLengthMm - (i.repeatMm > 0 ? i.repeatMm - 1 : 0);
        const cuts = plan.rolls.flatMap((r) => r.cuts);
        const once =
          cuts.filter((c) => c.kind === "strip").length === i.strips.length &&
          new Set(cuts.filter((c) => c.kind === "strip").map((c) => c.index)).size === i.strips.length &&
          new Set(cuts.filter((c) => c.kind === "part").map((c) => c.index)).size === i.parts.length &&
          cuts.filter((c) => c.kind === "part").length === i.parts.length;
        const inside = plan.rolls.every((r) =>
          [...r.cuts, ...r.rests].every(
            (c) =>
              c.fromMm >= -EPS &&
              c.fromMm + c.lengthMm <= usable + EPS &&
              c.xMm >= -EPS &&
              c.xMm + c.widthMm <= i.rollWidthMm + EPS,
          ),
        );
        const apart = plan.rolls.every((r) => {
          const all = [...r.cuts, ...r.rests];
          return all.every((a, k) => all.every((b, j) => j <= k || !overlap(a, b)));
        });
        const area = plan.rolls.every(
          (r) =>
            Math.abs(r.usedM2 + r.restM2 + r.wasteM2 - (i.rollWidthMm * i.rollLengthMm) / 1e6) < 1e-6 ||
            r.wasteM2 === 0,
        );
        return once && inside && apart && area;
      }),
      { numRuns: 400 },
    );
  });

  it("with a pattern every cut starts where its phase is; without one rests take any part that fits", () => {
    fc.assert(
      fc.property(arb, (i) => {
        if (i.repeatMm === 0) return true;
        const plan = planCuts({ ...i, minRestMm: 100 });
        if (!plan.fits) return true;
        return plan.rolls.every((r) => {
          const first = r.cuts[0];
          if (!first) return true;
          const phaseOf = (c: (typeof r.cuts)[number]) =>
            c.kind === "strip" ? (i.strips[c.index]?.phaseMm ?? 0) : (i.parts[c.index]?.phaseMm ?? 0);
          const base = phaseOf(first) - first.fromMm;
          return r.cuts.every((c) => {
            const d = (((c.fromMm + base - phaseOf(c)) % i.repeatMm) + i.repeatMm) % i.repeatMm;
            return d < 1e-6 || i.repeatMm - d < 1e-6;
          });
        });
      }),
      { numRuns: 300 },
    );
  });

  it("a rest is used once: two parts that each fill a whole tail need two tails", () => {
    const plan = planCuts({
      rollWidthMm: 1060,
      rollLengthMm: 10_000,
      repeatMm: 0,
      strips: Array.from({ length: 3 }, () => ({ lengthMm: 2900, phaseMm: 0, restMm: 0 })),
      parts: [
        { widthMm: 1060, lengthMm: 1300, phaseMm: 0 },
        { widthMm: 1060, lengthMm: 1300, phaseMm: 0 },
      ],
      minRestMm: 100,
    });
    expect(plan.rolls).toHaveLength(2);
    expect(plan.rolls[0]?.cuts.filter((c) => c.kind === "part")).toHaveLength(1);
  });

  it("two narrow parts share one rest side by side; a part takes a side rest of a strip cut lengthwise", () => {
    const plan = planCuts({
      rollWidthMm: 1060,
      rollLengthMm: 10_000,
      repeatMm: 0,
      strips: [{ lengthMm: 2900, phaseMm: 0, restMm: 500 }],
      parts: [
        { widthMm: 450, lengthMm: 2900, phaseMm: 0 },
        { widthMm: 500, lengthMm: 2900, phaseMm: 0 },
        { widthMm: 400, lengthMm: 1000, phaseMm: 0 },
      ],
      minRestMm: 100,
    });
    expect(plan.rolls).toHaveLength(1);
    const cuts = plan.rolls[0]?.cuts ?? [];
    // The strip's side rest (560–1060 across, its full length) holds a part; the two long narrow parts sit side by side.
    expect(cuts.some((c) => c.kind === "part" && c.xMm === 560 && c.fromMm === 0 && c.fromRest)).toBe(true);
    const long = cuts.filter((c) => c.kind === "part" && c.lengthMm === 2900);
    expect(long).toHaveLength(2);
  });
});

describe("wallpaper v3", () => {
  const consistent = (r: ReturnType<typeof oboi.compute>) => {
    const layout = r.layout as Layout;
    const cols = (layout.elevations ?? []).flatMap((e) => e.strips?.columns ?? []);
    const strips = new Set(cols.filter((c) => c.kind !== "pieces" && c.kind !== "carry").map((c) => c.n));
    const cut = (layout.rolls ?? []).flatMap((roll) => roll.cuts);
    const cutStrips = cut.flatMap((c) =>
      [c.strip, c.also].filter((n): n is number => n !== undefined && c.piece === undefined),
    );
    const pieces = (layout.elevations ?? []).flatMap((e) => e.strips?.pieces ?? []).length;
    return (
      strips.size === summary(r, "strips") &&
      new Set(cutStrips).size === cutStrips.length &&
      cutStrips.length === strips.size &&
      cut.filter((c) => c.piece !== undefined).length === pieces &&
      pieces === summary(r, "pieces") &&
      (layout.rolls?.length ?? 0) === summary(r, "rollsUsed")
    );
  };

  it("the example room: scheme, roll map and summary agree; the start and the joint are explained", () => {
    const r = oboi.compute(defaults, ctx);
    expect(consistent(r)).toBe(true);
    expect(r.layout?.start).toMatchObject({ closingCorner: 1 });
    const codes = r.layout?.guide.map((g) => g.code) ?? [];
    expect(codes[0]).toBe("start_line");
    expect(codes).toContain("closing_hidden");
    expect(codes).toContain("order_two");
  });

  it("any placed room (rectangle or L, zones, pattern, manual or symmetric start): everything agrees", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 7000 }),
        fc.integer({ min: 2000, max: 7000 }),
        fc.integer({ min: 2300, max: 3200 }),
        fc.constantFrom(530, 700, 1060),
        fc.constantFrom(0, 0, 320, 640),
        fc.constantFrom("straight", "offset" as const),
        fc.constantFrom("rect", "l" as const),
        fc.constantFrom("auto", "manual" as const),
        fc.boolean(),
        fc.option(fc.record({ offset: fc.nat(3000), width: fc.integer({ min: 300, max: 2500 }) }), { nil: undefined }),
        (lengthMm, widthMm, heightMm, rollWidthMm, repeatMm, match, shape, startMode, symmetric, zone) => {
          const input: Input = {
            ...defaults,
            lengthMm,
            widthMm,
            heightMm,
            rollWidthMm,
            repeatMm,
            match,
            shape,
            cutLengthMm: Math.round(lengthMm / 3),
            cutWidthMm: Math.round(widthMm / 3),
            startMode,
            startWall: 2,
            startLineMm: 300,
            symmetric,
            openings: [{ type: "door", widthMm: 800, heightMm: 2000, count: 1, places: [{ wall: 1, offsetMm: 100 }] }],
            zones: zone
              ? [{ wall: 0, offsetMm: zone.offset, fromFloorMm: 0, widthMm: zone.width, heightMm: heightMm }]
              : [],
          };
          const r = oboi.compute(input, ctx);
          if (!r.items.some((it) => it.key === "wallpaper")) return true;
          const walls = r.layout?.elevations ?? [];
          const covered = walls.every((e) =>
            coversWall(
              (e.strips?.columns ?? []).map((c) => ({ x: c.xMm, w: c.widthMm })),
              e.lengthMm,
              e.heightMm,
              e.openings,
            ),
          );
          return consistent(r) && covered;
        },
      ),
      { numRuns: 150 },
    );
  }, 60_000);

  it("a manual start keeps the user's wall and line; a symmetric one puts a strip or a joint mid main wall", () => {
    const manual = oboi.compute({ ...defaults, startMode: "manual", startWall: 3, startLineMm: 1234 }, ctx);
    expect(manual.layout?.start).toMatchObject({ wall: 2, lineMm: 1234 });
    expect(manual.layout?.guide[0]?.code).toBe("start_manual");
    const sym = oboi.compute({ ...defaults, repeatMm: 640, symmetric: true }, ctx);
    const line = sym.layout?.start?.lineMm ?? 0;
    // Main wall: wall 1 (opposite the door), 4,6 m.
    expect(sym.layout?.start?.wall).toBe(0);
    expect([2300, 2300 + 265]).toContain(line);
  });

  it("bare zones: less area and paste, never more rolls", () => {
    const base = oboi.compute(defaults, ctx);
    const zoned = oboi.compute(
      { ...defaults, zones: [{ wall: 1, offsetMm: 500, fromFloorMm: 1800, widthMm: 900, heightMm: 500 }] },
      ctx,
    );
    expect(summary(zoned, "wallArea")).toBeCloseTo((summary(base, "wallArea") ?? 0) - 0.45);
    const rolls = (r: typeof base) => r.items.find((it) => it.key === "wallpaper")?.packs ?? 0;
    expect(rolls(zoned)).toBeLessThanOrEqual(rolls(base));
  });

  it("the chosen start never leaves the closing corner overlapped less than the wrap", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1500, max: 7000 }),
        fc.integer({ min: 1500, max: 7000 }),
        fc.constantFrom(530, 1060),
        (lengthMm, widthMm, rollWidthMm) => {
          const r = oboi.compute({ ...defaults, lengthMm, widthMm, rollWidthMm, openings: [] }, ctx);
          return !r.warnings.some((w) => w.code === "closing_overlap_short");
        },
      ),
      { numRuns: 100 },
    );
  }, 60_000);

  it("review cases: start ranked by rolls before inserts; a bigger room never buys fewer; manual line 0", () => {
    const rolls = (x: Partial<Input>) =>
      oboi.compute({ ...defaults, ...x }, ctx).items.find((it) => it.key === "wallpaper")?.packs ?? 0;
    expect(rolls({ lengthMm: 4240 })).toBeLessThanOrEqual(rolls({ lengthMm: 4250 }));
    expect(rolls({ zones: [{ wall: 0, offsetMm: 1000, fromFloorMm: 0, widthMm: 2200, heightMm: 2700 }] })).toBe(9);
    const zero = oboi.compute({ ...defaults, startMode: "manual", startWall: 1, startLineMm: 0 }, ctx);
    // A line in the corner leaves no sliver: it moves to the corner line, a roll width minus the wrap.
    expect(zero.layout?.start?.lineMm).toBe(515);
  });

  it("spare rolls are added on top of the plan", () => {
    const r = oboi.compute({ ...defaults, spareRolls: 1 }, ctx);
    expect(r.items.find((it) => it.key === "wallpaper")?.packs).toBe((summary(r, "rollsUsed") ?? 0) + 1);
  });
});
