import { describe, expect, it } from "vitest";
import type { Room } from "../types";
import { doorWidthMm, floorAreaM2, openingsAreaM2, perimeterMm, polygonAreaMm2, wallAreaM2 } from "./geometry";

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
});
