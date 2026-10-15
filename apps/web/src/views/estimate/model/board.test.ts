import { aggregateEstimate, type Estimate, purchase } from "@umnyaut/calc";
import { describe, expect, it } from "vitest";
import { floorOf } from "@/entities/room";
import { getToolModule } from "@/entities/tool";
import { computeEstimate } from "@/features/estimate-totals";
import { estimateBoard } from "./board";
import { estimateText } from "./export";

const estimate: Estimate = {
  schemaVersion: 2,
  id: "e1",
  name: "Ремонт квартиры",
  country: "RU",
  rooms: [
    { id: "r1", name: "Зал", type: "living", lengthMm: 4600, widthMm: 4300, heightMm: 2700 },
    { id: "r2", name: "Ванная", type: "bathroom", lengthMm: 2200, widthMm: 1700, heightMm: 2500 },
    { id: "r3", name: "Спальня", type: "bedroom", lengthMm: 3800, widthMm: 3200 },
  ],
  calcs: [
    { id: "c1", roomId: "r1", tool: "plintus", toolVersion: 1, input: {}, openedAt: 1, addedAt: 1 },
    {
      id: "c2",
      roomId: "r1",
      tool: "laminat",
      toolVersion: 1,
      surface: "floor",
      input: { price_laminate: 1120 },
      openedAt: 2,
      addedAt: 2,
    },
    {
      id: "c3",
      roomId: "r2",
      tool: "plitka",
      toolVersion: 3,
      surface: "floor",
      label: "графит",
      input: {},
      openedAt: 3,
      addedAt: 3,
    },
    // A draft below the threshold: not on the page, the bedroom stays empty.
    { id: "c4", roomId: "r3", tool: "oboi", toolVersion: 4, surface: "walls", input: {}, openedAt: 4 },
  ],
  prices: {},
  updatedAt: 4,
};
const added = (c: Estimate["calcs"][number]) => c.addedAt !== undefined;

describe("estimate board", () => {
  const board = estimateBoard(estimate, computeEstimate(estimate, getToolModule, added), "RU");

  it("rooms with calcs in the order of works, the floor before its plinth", () => {
    expect(board.rooms.map((c) => c.room.name)).toEqual(["Зал", "Ванная"]);
    expect(board.rooms[0]?.rows.map((r) => r.tool.id)).toEqual(["laminat", "plintus"]);
    expect(board.rooms[0]?.size?.replace(/\s/g, " ")).toBe("4,6 × 4,3 × 2,7 м · 19,8 м²");
  });

  it("a row: tool and label, the surface and what comes with the main item, the quantity and its sum", () => {
    const laminate = board.rooms[0]?.rows[0];
    expect(laminate?.caption).toMatch(/^пол · \+ подложка \d+\s/);
    expect(laminate?.quantity).toMatch(/^\d+\sпач/);
    expect(laminate?.cost).toBeGreaterThan(0);
    expect(board.rooms[0]?.sum).toBe(laminate?.cost);
    // Plinth fittings by name only.
    expect(board.rooms[0]?.rows[1]?.caption).toMatch(/^\+ [а-я -]+(, [а-я -]+)+$/);
    const tile = board.rooms[1]?.rows[0];
    expect(tile?.title).toBe("Плитка · графит");
    expect(tile?.cost).toBeUndefined();
  });

  it("a room with only a draft is empty and suggests the usual works of its type except the drafted one", () => {
    expect(board.empty.map((c) => c.room.name)).toEqual(["Спальня"]);
    expect(board.empty[0]?.suggestions.map((t) => t.id)).toEqual(["laminat", "plintus"]);
  });

  it("shared consumables with the rooms they come from; metrics and the total", () => {
    expect(board.shared.map((r) => r.title)).toContain("Плиточный клей C1T");
    expect(board.shared.find((r) => r.title === "Плиточный клей C1T")?.from).toBe("Ванная");
    expect(board.metrics).toMatchObject({ rooms: 3, calcs: 3 });
    const floors = [19.78, 3.74, 12.16].reduce((a, b) => a + b, 0);
    expect(board.metrics.floorM2).toBeCloseTo(floors, 2);
    expect(board.total.byRoom.map((r) => r.name)).toEqual(["Зал", "Ванная", "Общие расходники"]);
    expect(board.total.sum).toBe(board.rooms[0]?.sum);
    expect(board.total.missing).toBeGreaterThan(0);
  });

  it("names the saving: in money with a price, in packs without", () => {
    const bag = { kind: "bag" as const, size: { value: 25, unit: "kg" as const } };
    const glue = (kg: number) => purchase("tile-adhesive", "related", { value: kg, unit: "kg" }, bag);
    const input = {
      roomIds: ["r1", "r2"],
      calcs: [
        { id: "c1", roomId: "r1", items: [glue(104.6)] },
        { id: "c2", roomId: "r2", items: [glue(60)] },
      ],
      shared: new Set(["tile-adhesive"]),
    };
    const packs = estimateBoard(estimate, aggregateEstimate({ ...input, prices: {} }), "RU");
    // 104,6 + 60 = 164,6 кг → 7 bags together; 5 + 3 = 8 apart.
    expect(packs.shared[0]?.from).toBe("Зал и Ванная · вместо 8");
    expect(packs.saving).toBe("Плиточный клей одной партией — на 1 упаковку меньше, чем по комнатам");
    expect(packs.metrics.saved).toBe("1 упаковку");
    const priced = aggregateEstimate({ ...input, prices: { [packs.shared[0]?.key ?? ""]: 520 } });
    const money = estimateBoard(estimate, priced, "RU");
    expect(money.saving).toBe("Плиточный клей одной партией — на 520 ₽ дешевле, чем по комнатам");
    expect(money.metrics.saved).toBe("520 ₽");
  });

  it("floor of an L-shaped room leaves out the cut", () => {
    expect(
      floorOf({
        shape: "l",
        lengthMm: 4000,
        widthMm: 3000,
        cutLengthMm: 1000,
        cutWidthMm: 1000,
        openings: [],
      }),
    ).toBeCloseTo(11, 5);
  });
});

describe("estimate as text", () => {
  it("name, rooms with their lines, shared consumables, the total", () => {
    const board = estimateBoard(estimate, computeEstimate(estimate, getToolModule, added), "RU");
    const text = estimateText("Ремонт квартиры", board, "RU").replace(/\s/g, " ");
    expect(text).toMatch(/^Ремонт квартиры {2}Зал Ламинат — \d+ пачек — [\d ]+ ₽ \(пол · \+ подложка/);
    expect(text).toContain("  Ванная Плитка · графит — ");
    expect(text).toContain("  Общие расходники Плиточный клей C1T — ");
    expect(text).toMatch(/ {2}Итого: [\d ]+ ₽, без \d+ позици[йи]$/);
  });
});
