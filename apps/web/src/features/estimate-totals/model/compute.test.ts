import { aggregateEstimate, type Estimate, purchase } from "@umnyaut/calc";
import { describe, expect, it } from "vitest";
import { getToolModule } from "@/entities/tool";
import { calcItems, computeEstimate, sharedOf, totalsOf } from "./compute";

const estimate: Estimate = {
  schemaVersion: 2,
  id: "e1",
  name: "Ремонт квартиры",
  country: "RU",
  rooms: [
    { id: "r1", name: "Ванная", type: "bathroom", lengthMm: 2200, widthMm: 1700, heightMm: 2500 },
    { id: "r2", name: "Кухня", type: "kitchen", lengthMm: 3000, widthMm: 2800 },
  ],
  calcs: [
    {
      id: "c1",
      roomId: "r1",
      tool: "plitka",
      toolVersion: 3,
      surface: "floor",
      input: { price_tile: 1650, "price_tile-adhesive": 520 },
      openedAt: 1,
      addedAt: 1,
    },
    { id: "c2", roomId: "r2", tool: "plitka", toolVersion: 3, surface: "floor", input: {}, openedAt: 2, addedAt: 2 },
    { id: "c3", roomId: "r2", tool: "laminat", toolVersion: 1, surface: "floor", input: {}, openedAt: 3 },
  ],
  prices: {},
  updatedAt: 3,
};
const moduleOf = getToolModule;

describe("estimate totals", () => {
  it("counts a calc in its own room", () => {
    const counted = calcItems(estimate, estimate.calcs[0] as Estimate["calcs"][number], moduleOf);
    const separate = getToolModule("plitka");
    const own = separate.compute(
      separate.input.parse({ ...separate.defaults({ country: "RU" }), lengthMm: 2200, widthMm: 1700, heightMm: 2500 }),
      { country: "RU" },
    );
    expect(counted?.items).toEqual(own.items);
  });

  it("drafts stay out of the totals; adhesive of two rooms is merged and each room sees its share", () => {
    const added = computeEstimate(estimate, moduleOf, (c) => c.addedAt !== undefined);
    expect(added.rooms.map((r) => r.lines.map((l) => l.calcId))).toEqual([["c1"], ["c2"]]);
    const tiles = added.rooms[0]?.lines[0]?.item.packs ?? 0;
    const glue = added.shared.find((l) => l.item.key === "tile-adhesive");
    // Tile priced in the bathroom only; adhesive priced once in a calculator, for the whole estimate.
    expect(totalsOf(added)).toMatchObject({
      byRoom: { r1: tiles * 1650, r2: 0 },
      sum: tiles * 1650 + (glue?.item.packs ?? 0) * 520,
    });
    const shared = sharedOf(added, estimate, "c1");
    expect(Object.keys(shared).sort()).toEqual(["grout", "tile-adhesive"]);
    expect(shared["tile-adhesive"]?.share).toMatch(/^Ванная: [\d,]+\sкг$/);
    expect(shared["tile-adhesive"]?.total).toMatch(new RegExp(`^${glue?.item.packs}\\s`));
    if ((glue?.savedPacks ?? 0) > 0) expect(shared["tile-adhesive"]?.saving).toContain("общий с «Кухня»");
  });

  it("says what merging saved: «7 мешков вместо 8 — общий с «Кухня»»", () => {
    const bag = { kind: "bag" as const, size: { value: 25, unit: "kg" as const } };
    const glue = (kg: number) => purchase("tile-adhesive", "related", { value: kg, unit: "kg" }, bag);
    const aggregate = aggregateEstimate({
      roomIds: ["r1", "r2"],
      calcs: [
        { id: "c1", roomId: "r1", items: [glue(104.6), glue(10)] },
        { id: "c2", roomId: "r2", items: [glue(60)] },
      ],
      shared: new Set(["tile-adhesive"]),
      prices: {},
    });
    // 104,6 + 10 + 60 = 174,6 кг → 7 bags together; 5 + 1 + 3 = 9 apart.
    expect(sharedOf(aggregate, estimate, "c1")["tile-adhesive"]).toEqual({
      total: "7\u00a0мешков",
      share: "Ванная: 114,6\u00a0кг",
      saving: "Плиточный клей на всю смету: 7\u00a0мешков вместо 9\u00a0мешков — общий с «Кухня»",
    });
  });
});
