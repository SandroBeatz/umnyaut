import { describe, expect, it } from "vitest";
import { purchase } from "../blocks/packs";
import { toolModules } from "../tools";
import type { Room } from "../types";
import { mergeItems, productKey } from "./merge";
import { type EstimateCalc, type EstimateRoom, migrateProject, nextId, type ProjectData, roomSchema } from "./schema";

const room: Room = {
  shape: "rect",
  lengthMm: 4600,
  widthMm: 4300,
  heightMm: 2700,
  openings: [{ type: "door", widthMm: 900, heightMm: 2000, count: 1 }],
};

const v1 = {
  schemaVersion: 1,
  title: "Ремонт квартиры",
  country: "RU",
  rooms: [
    {
      id: "r1",
      name: "Спальня",
      room,
      works: [{ tool: "laminat", toolVersion: 1, input: { packAreaM2: 2.22 }, prices: { laminate: 1450 } }],
    },
  ],
};

const estimate: ProjectData = {
  schemaVersion: 2,
  id: "e1",
  name: "Ремонт квартиры",
  country: "RU",
  rooms: [
    { id: "r1", name: "Ванная", type: "bathroom", shape: "rect", lengthMm: 2200, widthMm: 1700, heightMm: 2600 },
    { id: "r2", name: "", type: "other", lengthMm: 4600 },
  ],
  calcs: [
    {
      id: "c1",
      roomId: "r1",
      tool: "plitka",
      toolVersion: 3,
      surface: "walls",
      label: "белая",
      input: {},
      openedAt: 5,
    },
    { id: "c2", roomId: "r1", tool: "plitka", toolVersion: 3, surface: "floor", input: {}, openedAt: 6, addedAt: 7 },
  ],
  prices: { "tile-adhesive||bag|25|kg": 520 },
  totals: { sum: 1040, byRoom: { r1: 0, r2: 0 }, saved: 520, missing: 2, at: 8 },
  activeRoomId: "r1",
  updatedAt: 8,
};

describe("ProjectData v2 (the estimate)", () => {
  it("accepts a valid estimate and keeps the reserved master sheet as is", () => {
    expect(migrateProject(estimate)).toEqual({ ok: true, data: estimate });
    const withMaster = { ...estimate, master: { rate: 500 } };
    expect(migrateProject(withMaster)).toEqual({ ok: true, data: withMaster });
  });

  it("the Room type and the schema-1 room agree", () => {
    const parsed: Room = roomSchema.parse(room);
    expect(parsed).toEqual(room);
  });

  it("rejects unknown versions and invalid data without throwing", () => {
    expect(migrateProject({ ...estimate, schemaVersion: 3 })).toEqual({ ok: false, error: "unknown_version" });
    expect(migrateProject(null)).toEqual({ ok: false, error: "unknown_version" });
    expect(migrateProject("text")).toEqual({ ok: false, error: "unknown_version" });
    expect(migrateProject({ ...estimate, country: "US" })).toEqual({ ok: false, error: "invalid" });
    expect(migrateProject({ ...v1, rooms: [{ id: "r1" }] })).toEqual({ ok: false, error: "invalid" });
  });

  it("rejects calcs without their room, duplicate ids and an unknown active room", () => {
    const [c1, c2] = estimate.calcs as [EstimateCalc, EstimateCalc];
    const invalid = { ok: false, error: "invalid" };
    expect(migrateProject({ ...estimate, calcs: [{ ...c1, roomId: "r9" }] })).toEqual(invalid);
    expect(migrateProject({ ...estimate, calcs: [c1, { ...c2, id: "c1" }] })).toEqual(invalid);
    expect(migrateProject({ ...estimate, activeRoomId: "r9" })).toEqual(invalid);
  });

  it("keeps the limits: 20 rooms, 60 calcs, 40-letter names and labels", () => {
    const rooms = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i + 1}`, name: "", type: "other" }));
    const calcs = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `c${i + 1}`,
        roomId: "r1",
        tool: "laminat",
        toolVersion: 1,
        input: {},
        openedAt: 0,
      }));
    const base = { ...estimate, activeRoomId: undefined };
    expect(migrateProject({ ...base, rooms: rooms(20), calcs: calcs(60) }).ok).toBe(true);
    expect(migrateProject({ ...base, rooms: rooms(21), calcs: [] }).ok).toBe(false);
    expect(migrateProject({ ...base, rooms: rooms(1), calcs: calcs(61) }).ok).toBe(false);
    const [r1] = estimate.rooms as [EstimateRoom];
    expect(migrateProject({ ...estimate, rooms: [{ ...r1, name: "я".repeat(41) }] }).ok).toBe(false);
    const [c1, c2] = estimate.calcs as [EstimateCalc, EstimateCalc];
    expect(migrateProject({ ...estimate, calcs: [{ ...c1, label: "я".repeat(41) }, c2] }).ok).toBe(false);
  });

  it("moves schema 1: the planner room becomes a room, its works calcs already in the estimate", () => {
    expect(migrateProject(v1)).toEqual({
      ok: true,
      data: {
        schemaVersion: 2,
        id: "e1",
        name: "Ремонт квартиры",
        country: "RU",
        rooms: [
          {
            id: "r1",
            name: "Спальня",
            type: "other",
            shape: "rect",
            lengthMm: 4600,
            widthMm: 4300,
            heightMm: 2700,
            openings: room.openings,
          },
        ],
        calcs: [
          {
            id: "c1",
            roomId: "r1",
            tool: "laminat",
            toolVersion: 1,
            input: { packAreaM2: 2.22 },
            prices: { laminate: 1450 },
            openedAt: 0,
            addedAt: 0,
          },
        ],
        prices: {},
        updatedAt: 0,
      },
    });
  });

  it("moves schema 1: an L-cut is kept flat, a polygon becomes its rectangle, an unknown height stays unknown", () => {
    const l: Room = { ...room, shape: "l", cut: { lengthMm: 1500, widthMm: 1200 }, cutCorner: "nw", heightMm: 0 };
    const polygon: Room = {
      ...room,
      shape: "polygon",
      points: [
        [0, 0],
        [4600, 0],
        [0, 4300],
      ],
    };
    const rooms = [l, polygon].map((r, i) => ({ id: `r${i + 1}`, name: "", room: r, works: [] }));
    const result = migrateProject({ ...v1, rooms });
    if (!result.ok) throw new Error(result.error);
    expect(result.data.rooms[0]).toMatchObject({ shape: "l", cutLengthMm: 1500, cutWidthMm: 1200, cutCorner: "nw" });
    expect(result.data.rooms[0]).not.toHaveProperty("heightMm");
    expect(result.data.rooms[1]).toMatchObject({ shape: "rect", lengthMm: 4600, widthMm: 4300 });
    expect(result.data.rooms[1]).not.toHaveProperty("points");
  });
});

describe("nextId", () => {
  it("takes the next free number", () => {
    expect(nextId("r", [])).toBe("r1");
    expect(nextId("r", [{ id: "r1" }, { id: "r2" }])).toBe("r3");
    expect(nextId("c", [{ id: "c3" }])).toBe("c2");
    expect(nextId("c", [{ id: "c2" }, { id: "c3" }])).toBe("c4");
  });
});

describe("mergeItems", () => {
  const bag = { kind: "bag" as const, size: { value: 25, unit: "kg" as const } };
  const glue = (kg: number, role: "main" | "related" = "related") =>
    purchase("tile-adhesive", role, { value: kg, unit: "kg" }, bag, { nextTool: "klej" });

  it("sums needs before rounding: 10 + 10 kg is one 25 kg bag, not two", () => {
    const [merged, ...rest] = mergeItems([glue(10), glue(10, "main")]);
    expect(rest).toEqual([]);
    expect(merged).toMatchObject({ packs: 1, role: "main", need: { value: 20 }, nextTool: "klej" });
  });

  it("keeps different pack sizes and different items apart, in first-seen order", () => {
    const small = purchase(
      "tile-adhesive",
      "related",
      { value: 3, unit: "kg" },
      { kind: "bag", size: { value: 5, unit: "kg" } },
    );
    const grout = purchase(
      "grout",
      "related",
      { value: 2, unit: "kg" },
      { kind: "bag", size: { value: 2, unit: "kg" } },
    );
    const merged = mergeItems([glue(30), grout, small, glue(30)]);
    expect(merged.map((i) => [i.key, i.pack.size.value, i.packs])).toEqual([
      ["tile-adhesive", 25, 3],
      ["grout", 2, 1],
      ["tile-adhesive", 5, 1],
    ]);
  });

  it("keeps variants apart: white and graphite grout are two products", () => {
    const pack = { kind: "bag" as const, size: { value: 2, unit: "kg" as const } };
    const white = purchase("grout", "related", { value: 1.2, unit: "kg" }, pack, { variant: "white" });
    const graphite = purchase("grout", "related", { value: 1.2, unit: "kg" }, pack, { variant: "graphite" });
    const merged = mergeItems([white, graphite, white]);
    expect(merged.map((i) => [i.variant, i.packs])).toEqual([
      ["white", 2],
      ["graphite", 1],
    ]);
  });
});

describe("productKey", () => {
  it("is item | variant | pack kind | pack size", () => {
    const bag = { kind: "bag" as const, size: { value: 25, unit: "kg" as const } };
    const glue = purchase("tile-adhesive", "related", { value: 10, unit: "kg" }, bag);
    expect(productKey(glue)).toBe("tile-adhesive||bag|25|kg");
    expect(productKey({ ...glue, variant: "flex" })).toBe("tile-adhesive|flex|bag|25|kg");
  });
});

describe("wall list merge", () => {
  it("primer under wallpaper and under ceiling paint is rounded to canisters once", () => {
    const ctx = { country: "RU" } as const;
    const walls = toolModules.oboi.compute(toolModules.oboi.defaults(ctx), ctx);
    const ceiling = toolModules.kraska.compute({ ...toolModules.kraska.defaults(ctx), surface: "ceiling" }, ctx);
    // 6,717 + 2,967 = 9,684 л → one 10 л canister, not two.
    const primer = mergeItems([...walls.items, ...ceiling.items]).filter((i) => i.key === "primer");
    expect(primer).toHaveLength(1);
    expect(primer[0]?.packs).toBe(1);
    expect(primer[0]?.need.value).toBeCloseTo(9.684, 9);
  });
});
