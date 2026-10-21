import { describe, expect, it } from "vitest";
import type { Room } from "../types";
import {
  clippedOpeningsAreaM2,
  doorWidthMm,
  floorAreaM2,
  openingHeightInMm,
  openingsAreaM2,
  perimeterMm,
  polygonAreaMm2,
  wallAreaM2,
} from "./geometry";

const rect = (lengthMm: number, widthMm: number, heightMm = 2700, extra: Partial<Room> = {}): Room => ({
  shape: "rect",
  lengthMm,
  widthMm,
  heightMm,
  openings: [],
  ...extra,
});

describe("geometry", () => {
  it("rect 4.6 × 4.3: area 19.78 m², perimeter 17.8 m", () => {
    expect(floorAreaM2(rect(4600, 4300))).toBeCloseTo(19.78, 10);
    expect(perimeterMm(rect(4600, 4300))).toBe(17_800);
  });

  it("L-shape 6 × 4 minus 2 × 1.5 cut: 21 m², perimeter of the bounding rect", () => {
    const room = rect(6000, 4000, 2700, { shape: "l", cut: { lengthMm: 2000, widthMm: 1500 } });
    expect(floorAreaM2(room)).toBeCloseTo(21, 10);
    expect(perimeterMm(room)).toBe(20_000);
  });

  it("clamps a cut-out larger than the room to an empty floor", () => {
    const room = rect(3000, 3000, 2700, { shape: "l", cut: { lengthMm: 5000, widthMm: 5000 } });
    expect(floorAreaM2(room)).toBe(0);
  });

  it("ignores a cut-out on a rect room", () => {
    expect(floorAreaM2(rect(3000, 3000, 2700, { cut: { lengthMm: 1000, widthMm: 1000 } }))).toBeCloseTo(9, 10);
  });

  it("polygon: 3-4-5 triangle is 6 m² and 12 m, independent of winding", () => {
    const points = [
      [0, 0],
      [3000, 0],
      [0, 4000],
    ] as const;
    const room = rect(0, 0, 2700, { shape: "polygon", points });
    expect(floorAreaM2(room)).toBeCloseTo(6, 10);
    expect(perimeterMm(room)).toBeCloseTo(12_000, 6);
    expect(polygonAreaMm2([...points].reverse())).toBe(6_000_000);
  });

  it("polygon without enough points falls back to the rect", () => {
    const room = rect(2000, 3000, 2700, { shape: "polygon", points: [[0, 0]] });
    expect(floorAreaM2(room)).toBeCloseTo(6, 10);
    expect(perimeterMm(room)).toBe(10_000);
  });

  it("walls 4.6 × 4.3 × 2.7 minus a door and two windows: 48.06 − 6 = 42.06 m²", () => {
    const room = rect(4600, 4300, 2700, {
      openings: [
        { type: "door", widthMm: 900, heightMm: 2000, count: 1 },
        { type: "window", widthMm: 1500, heightMm: 1400, count: 2 },
      ],
    });
    const walls = wallAreaM2(room);
    expect(walls.grossM2).toBeCloseTo(48.06, 10);
    expect(walls.openingsM2).toBeCloseTo(6, 10);
    expect(walls.areaM2).toBeCloseTo(42.06, 10);
    expect(walls.openingsExceedWalls).toBe(false);
    expect(doorWidthMm(room.openings)).toBe(900);
  });

  it("openings larger than the walls give zero area and a flag, never a negative number", () => {
    const room = rect(1000, 1000, 1000, { openings: [{ type: "window", widthMm: 3000, heightMm: 3000, count: 1 }] });
    expect(wallAreaM2(room)).toMatchObject({ areaM2: 0, openingsExceedWalls: true });
    expect(openingsAreaM2([])).toBe(0);
  });

  it("«height»: a door taller than the wall takes only the wall's height — 35 − 0,9 × 2,5 = 32,75", () => {
    const room = rect(4000, 3000, 2500, { openings: [{ type: "door", widthMm: 900, heightMm: 2600, count: 1 }] });
    expect(wallAreaM2(room).areaM2).toBeCloseTo(32.66, 10);
    expect(wallAreaM2(room, "height")).toMatchObject({ grossM2: 35, openingsM2: 2.25, areaM2: 32.75 });
  });

  it("«band» to 1,5 m: door 0,8 × 1,5, window on its 0,9 m sill 1,2 × 0,6 — 16,5 − 1,92 = 14,58", () => {
    const openings = [
      { type: "door" as const, widthMm: 800, heightMm: 2000, count: 1 },
      { type: "window" as const, widthMm: 1200, heightMm: 1400, count: 1 },
    ];
    const walls = wallAreaM2(rect(3000, 2500, 1500, { openings }), "band");
    expect(walls.openingsM2).toBeCloseTo(1.92, 10);
    expect(walls.areaM2).toBeCloseTo(14.58, 10);
  });

  it("«band» takes each placed window's own sill; unplaced copies the usual 0,9 m; above the band — nothing", () => {
    const window = (sills: number[], count: number) => ({
      type: "window" as const,
      widthMm: 1000,
      heightMm: 1000,
      count,
      places: sills.map((sillMm) => ({ wall: 0, offsetMm: 0, sillMm })),
    });
    // Sill 1200 → 1200…1500 = 0,3 m²; sill 1600 → 0; one more unplaced on 900 → 900…1500 = 0,6 m².
    expect(clippedOpeningsAreaM2([window([1200, 1600], 3)], 1500, "band")).toBeCloseTo(0.9, 10);
    expect(openingHeightInMm({ type: "window", heightMm: 1000 }, 1500, "none")).toBe(1000);
    expect(openingHeightInMm({ type: "window", heightMm: 3000 }, 2500, "height")).toBe(2500);
    expect(openingHeightInMm({ type: "door", heightMm: 2000 }, 1500, "band")).toBe(1500);
  });
});
