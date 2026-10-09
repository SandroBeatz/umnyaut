import type { GoldenFile } from "../../golden";
import type { PloshchadStenInput } from "./index";

type Opening = PloshchadStenInput["openings"][number];
const door = (widthMm: number, heightMm: number, count = 1): Opening => ({ type: "door", widthMm, heightMm, count });
const window = (widthMm: number, heightMm: number, count = 1): Opening => ({
  type: "window",
  widthMm,
  heightMm,
  count,
});

/**
 * Hand derivations: P = 2 × (L + W), walls gross = P × H, openings = Σ w × h × n, net = gross − openings
 * (never below zero), ceiling = L × W.
 */
export const golden: GoldenFile<PloshchadStenInput> = {
  tool: "ploshchad-sten",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 × 2.7 m with a door and a window (defaults)",
      input: {},
      expected: {
        summary: { wallArea: 44.78, grossWallArea: 48.06, openingsArea: 3.28, ceilingArea: 19.78, perimeter: 17.8 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: "2 × (4,6 + 4,3) × 2,7 = 48,06; 0,8 × 2 + 1,2 × 1,4 = 3,28; 48,06 − 3,28 = 44,78 м²",
      },
    },
    {
      name: "No openings 3 × 3 × 2.5 m",
      input: { lengthMm: 3000, widthMm: 3000, heightMm: 2500, openings: [] },
      expected: { summary: { wallArea: 30, grossWallArea: 30, openingsArea: 0, ceilingArea: 9 }, warnings: [] },
      source: { kind: "manual", ref: "2 × 6 × 2,5 = 30 м²; потолок 3 × 3 = 9 м²" },
    },
    {
      name: "Two windows of the same size",
      input: { lengthMm: 5000, widthMm: 4000, heightMm: 2700, openings: [door(900, 2050), window(1500, 1500, 2)] },
      expected: { summary: { wallArea: 42.255, grossWallArea: 48.6, openingsArea: 6.345, ceilingArea: 20 } },
      source: { kind: "manual", ref: "18 × 2,7 = 48,6; 0,9 × 2,05 + 2 × 1,5 × 1,5 = 6,345; 48,6 − 6,345 = 42,255 м²" },
    },
    {
      name: "High ceiling 6 × 5 × 3.2 m",
      input: { lengthMm: 6000, widthMm: 5000, heightMm: 3200, openings: [] },
      expected: { summary: { wallArea: 70.4, ceilingArea: 30, perimeter: 22 } },
      source: { kind: "manual", ref: "2 × 11 × 3,2 = 70,4 м²" },
    },
    {
      name: "Bathroom 1.7 × 1.5 × 2.5 m with one door",
      input: { lengthMm: 1700, widthMm: 1500, heightMm: 2500, openings: [door(700, 2000)] },
      expected: { summary: { wallArea: 14.6, grossWallArea: 16, openingsArea: 1.4, ceilingArea: 2.55 } },
      source: { kind: "manual", ref: "2 × 3,2 × 2,5 = 16; 16 − 0,7 × 2 = 14,6 м²; потолок 1,7 × 1,5 = 2,55 м²" },
    },
    {
      name: "Opening with zero count is ignored",
      input: { lengthMm: 4000, widthMm: 3000, heightMm: 2700, openings: [door(800, 2000, 0)] },
      expected: { summary: { wallArea: 37.8, openingsArea: 0 }, warnings: [] },
      source: { kind: "manual", ref: "Дверей 0: 2 × 7 × 2,7 = 37,8 м²" },
    },
    {
      name: "Hall with four windows and two double doors",
      input: {
        lengthMm: 12000,
        widthMm: 8000,
        heightMm: 3000,
        openings: [window(1800, 1600, 4), door(1400, 2100, 2)],
      },
      expected: { summary: { wallArea: 102.6, grossWallArea: 120, openingsArea: 17.4, ceilingArea: 96 } },
      source: { kind: "manual", ref: "40 × 3 = 120; 4 × 1,8 × 1,6 + 2 × 1,4 × 2,1 = 11,52 + 5,88 = 17,4; 102,6 м²" },
    },
    {
      name: "Balcony door, window and entrance door",
      input: {
        lengthMm: 3500,
        widthMm: 3200,
        heightMm: 2600,
        openings: [door(700, 2200), window(1300, 1400), door(800, 2000)],
      },
      expected: { summary: { wallArea: 29.88, grossWallArea: 34.84, openingsArea: 4.96, ceilingArea: 11.2 } },
      source: {
        kind: "manual",
        ref: "13,4 × 2,6 = 34,84; 1,54 + 1,82 + 1,6 = 4,96; 34,84 − 4,96 = 29,88 м²",
      },
    },
    {
      name: "Door taller than the wall → warning, area still counted",
      input: { lengthMm: 4000, widthMm: 3000, heightMm: 2500, openings: [door(900, 2600)] },
      expected: { summary: { wallArea: 32.66, grossWallArea: 35 }, warnings: ["opening_too_tall"] },
      source: { kind: "manual", ref: "14 × 2,5 = 35; 35 − 0,9 × 2,6 = 32,66 м²; дверь 2,6 м выше стены 2,5 м" },
    },
    {
      name: "Openings larger than the walls → zero, not negative",
      input: { lengthMm: 1000, widthMm: 1000, heightMm: 1000, openings: [window(3000, 3000)] },
      expected: {
        summary: { wallArea: 0, grossWallArea: 4, openingsArea: 9 },
        warnings: ["openings_exceed_walls", "opening_too_tall"],
      },
      source: { kind: "manual", ref: "4 × 1 = 4 м² стен, окно 9 м²: площадь стен 0, а не −5" },
    },
  ],
};
