import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { purchase } from "../blocks/packs";
import { toolModules } from "../tools";
import type { PurchaseItem } from "../types";
import { aggregateEstimate, type EstimateCalcItems } from "./estimate";
import { productKey } from "./merge";

const bag = { kind: "bag" as const, size: { value: 25, unit: "kg" as const } };
const box = { kind: "box" as const, size: { value: 10, unit: "pcs" as const } };
const groutPack = { kind: "bag" as const, size: { value: 2, unit: "kg" as const } };
const glue = (kg: number, role: PurchaseItem["role"] = "related") =>
  purchase("tile-adhesive", role, { value: kg, unit: "kg" }, bag);
const tile = (pcs: number) => purchase("tile", "main", { value: pcs, unit: "pcs" }, box);
const grout = (kg: number, variant: string) =>
  purchase("grout", "related", { value: kg, unit: "kg" }, groutPack, { variant });
const shared = new Set(["tile-adhesive", "grout", "primer", "wallpaper-glue"]);
const GLUE = "tile-adhesive||bag|25|kg";

const calc = (id: string, roomId: string, items: PurchaseItem[], extra: Partial<EstimateCalcItems> = {}) => ({
  id,
  roomId,
  items,
  ...extra,
});

describe("aggregateEstimate", () => {
  it("keeps tile with its room and sums adhesive across rooms: 6 bags apart, 4 together", () => {
    const result = aggregateEstimate({
      roomIds: ["bath", "kitchen"],
      calcs: [
        calc("c1", "bath", [tile(140), glue(40)], { surface: "walls", prices: { tile: 1200 } }),
        calc("c2", "bath", [tile(60), glue(30)], { surface: "floor" }),
        calc("c3", "kitchen", [tile(80), glue(30)], { surface: "floor", prices: { tile: 900 } }),
      ],
      shared,
      prices: { [GLUE]: 500 },
    });
    expect(result.rooms.map((r) => r.lines.map((l) => [l.calcId, l.item.key, l.item.packs, l.cost]))).toEqual([
      [
        ["c1", "tile", 14, 16_800],
        ["c2", "tile", 6, undefined],
      ],
      [["c3", "tile", 8, 7200]],
    ]);
    const [adhesive] = result.shared;
    expect(adhesive).toMatchObject({
      productKey: GLUE,
      separatePacks: 6,
      savedPacks: 2,
      price: 500,
      cost: 2000,
      saved: 1000,
    });
    expect(adhesive?.item).toMatchObject({ need: { value: 100 }, packs: 4 });
    expect(adhesive?.shares.map((s) => [s.calcId, s.roomId, s.need, s.packs])).toEqual([
      ["c1", "bath", 40, 2],
      ["c2", "bath", 30, 2],
      ["c3", "kitchen", 30, 2],
    ]);
    expect(result.totals).toEqual({
      sum: 16_800 + 7200 + 2000,
      byRoom: { bath: 16_800, kitchen: 7200 },
      saved: 1000,
      savedPacks: 2,
      missing: 1,
    });
    expect(result.overlaps).toEqual([]);
  });

  it("white and graphite grout stay two lines; savings without a price are packs only", () => {
    const result = aggregateEstimate({
      roomIds: ["bath"],
      calcs: [
        calc("c1", "bath", [tile(10), grout(1.5, "white")], { surface: "walls" }),
        calc("c2", "bath", [tile(10), grout(1.5, "graphite")], { surface: "floor" }),
        calc("c3", "bath", [grout(0.4, "white")], { surface: "walls" }),
      ],
      shared,
      prices: {},
    });
    expect(result.shared.map((l) => [l.item.variant, l.item.packs, l.separatePacks, l.saved])).toEqual([
      ["white", 1, 2, undefined],
      ["graphite", 1, 1, undefined],
    ]);
    expect(result.totals).toMatchObject({ sum: 0, saved: 0, savedPacks: 1, missing: 4 });
  });

  it("an adhesive calc replaces tile's adhesive only in its room and on its surface (Р11)", () => {
    const result = aggregateEstimate({
      roomIds: ["bath", "kitchen"],
      calcs: [
        calc("tileFloor", "bath", [tile(60), glue(30)], { surface: "floor" }),
        calc("tileWalls", "bath", [tile(140), glue(40)], { surface: "walls" }),
        calc("glueFloor", "bath", [glue(35, "main")], { surface: "floor" }),
        calc("kitchenFloor", "kitchen", [tile(80), glue(30)], { surface: "floor" }),
      ],
      shared,
      prices: {},
    });
    expect(result.replaced).toEqual([{ calcId: "tileFloor", by: "glueFloor", key: "tile-adhesive" }]);
    expect(result.shared[0]?.shares.map((s) => [s.calcId, s.need])).toEqual([
      ["tileWalls", 40],
      ["glueFloor", 35],
      ["kitchenFloor", 30],
    ]);
    // Adhesive is a consumable, not a finish: «Клей» on the floor does not overlap «Плитка» on the floor.
    expect(result.overlaps).toEqual([]);
  });

  it("an adhesive calc on «Пол и стены» replaces both tile calcs; one without a surface replaces any", () => {
    const tiles = [
      calc("tileFloor", "bath", [tile(60), glue(30)], { surface: "floor" }),
      calc("tileWalls", "bath", [tile(140), glue(40)], { surface: "walls" }),
    ];
    const both = aggregateEstimate({
      roomIds: ["bath"],
      calcs: [...tiles, calc("glue", "bath", [glue(70, "main")], { surface: "floor-walls" })],
      shared,
      prices: {},
    });
    expect(both.replaced.map((r) => r.calcId)).toEqual(["tileFloor", "tileWalls"]);
    const any = aggregateEstimate({
      roomIds: ["bath"],
      calcs: [...tiles, calc("glue", "bath", [glue(70, "main")])],
      shared,
      prices: {},
    });
    expect(any.replaced.map((r) => r.calcId)).toEqual(["tileFloor", "tileWalls"]);
  });

  it("an adhesive calc covering only part of a tile calc replaces nothing: the walls' share is not lost", () => {
    const result = aggregateEstimate({
      roomIds: ["bath"],
      calcs: [
        calc("tileBoth", "bath", [tile(200), glue(70)], { surface: "floor-walls" }),
        calc("glueFloor", "bath", [glue(30, "main")], { surface: "floor" }),
      ],
      shared,
      prices: {},
    });
    expect(result.replaced).toEqual([]);
    // Both kept: 70 + 30 kg — a little extra on the floor rather than the walls without adhesive.
    expect(result.shared.find((l) => l.item.key === "tile-adhesive")?.shares.map((x) => x.need)).toEqual([70, 30]);
  });

  it("finds two finishes on one surface of a room: tile on «Пол и стены» and on «Пол», wallpaper and paint", () => {
    const paint = purchase("paint", "main", { value: 9, unit: "l" }, { kind: "can", size: { value: 9, unit: "l" } });
    const paper = purchase(
      "wallpaper",
      "main",
      { value: 8, unit: "pcs" },
      { kind: "roll", size: { value: 1, unit: "pcs" } },
    );
    const result = aggregateEstimate({
      roomIds: ["bath", "living"],
      calcs: [
        calc("both", "bath", [tile(200)], { surface: "floor-walls" }),
        calc("floor", "bath", [tile(60)], { surface: "floor" }),
        calc("ceiling", "bath", [paint], { surface: "ceiling" }),
        calc("paper", "living", [paper], { surface: "walls" }),
        calc("paint", "living", [paint], { surface: "walls-ceiling" }),
        calc("plinth", "living", [purchase("plinth", "main", { value: 7, unit: "pcs" }, box)]),
      ],
      shared,
      prices: {},
    });
    expect(result.overlaps).toEqual([
      { roomId: "bath", calcIds: ["both", "floor"], parts: ["floor"] },
      { roomId: "living", calcIds: ["paper", "paint"], parts: ["walls"] },
    ]);
  });

  it("real tools: tile in the bathroom and the kitchen buy adhesive once", () => {
    const ctx = { country: "RU" } as const;
    const plitka = toolModules.plitka;
    const bath = plitka.compute({ ...plitka.defaults(ctx), lengthMm: 2200, widthMm: 1700 }, ctx);
    const kitchen = plitka.compute({ ...plitka.defaults(ctx), lengthMm: 3000, widthMm: 2800 }, ctx);
    const result = aggregateEstimate({
      roomIds: ["bath", "kitchen"],
      calcs: [
        calc("c1", "bath", [...bath.items], { surface: "floor" }),
        calc("c2", "kitchen", [...kitchen.items], { surface: "floor" }),
      ],
      shared,
      prices: {},
    });
    expect(result.rooms.map((r) => r.lines.map((l) => l.item.key))).toEqual([["tile"], ["tile"]]);
    const adhesive = result.shared.find((l) => l.item.key === "tile-adhesive");
    const separate = [...bath.items, ...kitchen.items].filter((i) => i.key === "tile-adhesive");
    expect(adhesive?.item.need.value).toBeCloseTo(
      separate.reduce((n, i) => n + i.need.value, 0),
      9,
    );
    expect(adhesive?.item.packs).toBeLessThanOrEqual(separate.reduce((n, i) => n + i.packs, 0));
  });

  it("merged need covers every share, never more packs than apart, totals add up", () => {
    const share = fc.record({
      room: fc.constantFrom("r1", "r2", "r3"),
      kg: fc.integer({ min: 1, max: 200_000 }).map((g) => g / 1000),
      size: fc.constantFrom(5, 25),
      variant: fc.constantFrom(undefined, "flex"),
      tiles: fc.integer({ min: 0, max: 400 }),
      tilePrice: fc.option(fc.integer({ min: 1, max: 5000 }), { nil: undefined }),
    });
    fc.assert(
      fc.property(
        fc.array(share, { maxLength: 12 }),
        fc.option(fc.integer({ min: 1, max: 900 }), { nil: undefined }),
        (rows, glue) => {
          const calcs = rows.map((r, i) => {
            const pack = { kind: "bag" as const, size: { value: r.size, unit: "kg" as const } };
            const adhesive = purchase("tile-adhesive", "related", { value: r.kg, unit: "kg" }, pack, {
              ...(r.variant ? { variant: r.variant } : {}),
            });
            return calc(`c${i}`, r.room, [...(r.tiles > 0 ? [tile(r.tiles)] : []), adhesive], {
              surface: "floor",
              ...(r.tilePrice ? { prices: { tile: r.tilePrice } } : {}),
            });
          });
          const prices: Record<string, number> = glue === undefined ? {} : { [GLUE]: glue };
          const result = aggregateEstimate({ roomIds: ["r1", "r2", "r3"], calcs, shared, prices });
          for (const line of result.shared) {
            const need = line.shares.reduce((n, s) => n + s.need, 0);
            expect(line.item.need.value).toBeCloseTo(need, 6);
            expect(line.item.bought.value).toBeGreaterThanOrEqual(need * (1 - 1e-9));
            expect(line.item.packs).toBeLessThanOrEqual(line.separatePacks);
            expect(line.savedPacks).toBe(line.separatePacks - line.item.packs);
          }
          expect(result.shared.reduce((n, l) => n + l.shares.length, 0)).toBe(rows.length);
          const costs = [...result.rooms.flatMap((r) => r.lines), ...result.shared].reduce(
            (n, l) => n + (l.cost ?? 0),
            0,
          );
          expect(result.totals.sum).toBeCloseTo(costs, 6);
          expect(new Set(result.shared.map((l) => productKey(l.item))).size).toBe(result.shared.length);
        },
      ),
      { numRuns: 300 },
    );
  });
});
