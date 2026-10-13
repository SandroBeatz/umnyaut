import type { EstimateRoom } from "@umnyaut/calc";
import { tools } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { formOf, recalcOf, roomOf, totalsOf, wallBoundOf } from "./editor";

const door = { type: "door", widthMm: 800, heightMm: 2000, count: 1 } as const;
const window = { type: "window", widthMm: 1200, heightMm: 1400, count: 1 } as const;
const room: EstimateRoom = {
  id: "r1",
  name: "Спальня",
  type: "bedroom",
  shape: "rect",
  lengthMm: 4600,
  widthMm: 4300,
  heightMm: 2700,
  openings: [door, { ...window, places: [{ wall: 1, offsetMm: 1500 }] }],
};

describe("room editor", () => {
  it("a stored room goes through the form unchanged", () => {
    const { id: _, ...saved } = room;
    expect(roomOf(formOf(room, "Комната 2"))).toEqual(saved);
  });

  it("a new room starts named, without sizes; empty sizes stay out", () => {
    const form = formOf(null, "Комната 3");
    expect(form).toMatchObject({ name: "Комната 3", type: "other", shape: "rect", openings: [] });
    expect(roomOf(form)).toEqual({ name: "Комната 3", type: "other", shape: "rect", openings: [] });
    expect(totalsOf(form)).toBeUndefined();
  });

  it("what the room does not know comes from the calculator's draft; what it knows wins", () => {
    const draft = { lengthMm: 3000, widthMm: 2500, heightMm: 2600, openings: [door] };
    const partial: EstimateRoom = { id: "r1", name: "Кухня", type: "kitchen", lengthMm: 4000 };
    expect(roomOf(formOf(partial, "", draft))).toEqual({
      name: "Кухня",
      type: "kitchen",
      shape: "rect",
      lengthMm: 4000,
      widthMm: 2500,
      heightMm: 2600,
      openings: [door],
    });
    expect(roomOf(formOf({ ...partial, openings: [] }, "", draft)).openings).toEqual([]);
  });

  it("totals as the area tools count them: floor, perimeter, walls without openings, ceiling", () => {
    // 4,6 × 4,3 = 19,78 м²; 2 × 8,9 = 17,8 м; 17,8 × 2,7 − 1,6 − 1,68 = 44,78 м².
    expect(totalsOf(formOf(room, ""))).toEqual({ floorM2: 19.78, perimeterM: 17.8, wallsM2: 44.78, ceilingM2: 19.78 });
    const l = { ...formOf(room, ""), shape: "l" as const, heightMm: undefined };
    // L-shape: 19,78 − 1,5 × 1,2 = 17,98 м²; same perimeter; no walls without a height.
    expect(totalsOf(l)).toEqual({ floorM2: 17.98, perimeterM: 17.8, ceilingM2: 17.98 });
  });

  it("an L-shape keeps its cut-out; back to a rectangle drops it and places on walls it no longer has", () => {
    const l = { ...formOf(room, ""), shape: "l" as const, cutCorner: "nw" as const };
    l.openings = l.openings.map((o, i) => (i === 0 ? { ...o, place: { wall: 5, offsetMm: 100 } } : o));
    expect(roomOf(l)).toMatchObject({ shape: "l", cutLengthMm: 1500, cutWidthMm: 1200, cutCorner: "nw" });
    const rect = roomOf({ ...l, shape: "rect" });
    expect(rect).not.toHaveProperty("cutLengthMm");
    expect(rect.openings).toEqual([
      { ...door, count: 1 },
      { ...window, count: 1, places: [{ wall: 1, offsetMm: 1500 }] },
    ]);
  });

  it("names the calcs it recounts, and the wallpaper start reset when the walls are numbered anew (Р10)", () => {
    const calcs = [
      {
        id: "c1",
        roomId: "r1",
        tool: "oboi",
        toolVersion: 4,
        input: { startMode: "manual", startWall: 3 },
        openedAt: 0,
      },
      { id: "c2", roomId: "r1", tool: "plitka", toolVersion: 3, input: {}, openedAt: 0 },
      { id: "c3", roomId: "r2", tool: "laminat", toolVersion: 1, input: {}, openedAt: 0 },
    ];
    const same = recalcOf(room, formOf(room, ""), calcs, tools);
    expect(same).toEqual({ tools: ["Обои", "Плитка"], resets: [] });
    const l = recalcOf(room, { ...formOf(room, ""), shape: "l" }, calcs, tools);
    expect(l.resets).toEqual([{ tool: "Обои", what: "начало оклейки, главную стену и зоны без обоев" }]);
    expect(recalcOf(null, formOf(null, ""), calcs, tools)).toEqual({ tools: [], resets: [] });
    expect(wallBoundOf(tools)).toEqual({ oboi: ["startMode", "startWall", "startLineMm", "mainWall", "zones"] });
  });
});
