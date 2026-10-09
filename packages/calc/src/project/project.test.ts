import { describe, expect, it } from "vitest";
import { purchase } from "../blocks/packs";
import type { Room } from "../types";
import { mergeItems } from "./merge";
import { migrateProject, type ProjectData, roomSchema } from "./schema";

const room: Room = {
  shape: "rect",
  lengthMm: 4600,
  widthMm: 4300,
  heightMm: 2700,
  openings: [{ type: "door", widthMm: 900, heightMm: 2000, count: 1 }],
};

const project: ProjectData = {
  schemaVersion: 1,
  country: "RU",
  rooms: [
    { id: "r1", name: "Спальня", room, works: [{ tool: "laminat", toolVersion: 1, input: { packAreaM2: 2.22 } }] },
  ],
};

describe("ProjectData v1", () => {
  it("accepts a valid project and keeps the reserved master sheet as is", () => {
    expect(migrateProject(project)).toEqual({ ok: true, data: project });
    const withMaster = { ...project, master: { rate: 500 } };
    expect(migrateProject(withMaster)).toEqual({ ok: true, data: withMaster });
  });

  it("the Room type and its schema agree", () => {
    const parsed: Room = roomSchema.parse(room);
    expect(parsed).toEqual(room);
  });

  it("rejects unknown versions and invalid data without throwing", () => {
    expect(migrateProject({ ...project, schemaVersion: 2 })).toEqual({ ok: false, error: "unknown_version" });
    expect(migrateProject(null)).toEqual({ ok: false, error: "unknown_version" });
    expect(migrateProject({ ...project, rooms: [] })).toEqual({ ok: false, error: "invalid" });
    expect(migrateProject({ ...project, country: "US" })).toEqual({ ok: false, error: "invalid" });
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
});
