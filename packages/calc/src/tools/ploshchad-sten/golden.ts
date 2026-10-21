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
 * (never below zero), ceiling = L × W minus the L-shape's cut-out; an L-shape's perimeter is its rectangle's.
 */
export const golden: GoldenFile<PloshchadStenInput> = {
  tool: "ploshchad-sten",
  examples: [
    {
      name: "L-shaped room 4.6 × 4.3 × 2.7 m, cut-out 1.5 × 1.2 m: walls as the rectangle, ceiling smaller",
      input: { shape: "l", openings: [] },
      expected: {
        summary: { wallArea: 48.06, grossWallArea: 48.06, ceilingArea: 17.98, perimeter: 17.8 },
        warnings: [],
      },
      source: {
        kind: "manual",
        ref: "Периметр Г-образной = 2 × (4,6 + 4,3) = 17,8 м; 17,8 × 2,7 = 48,06 м²; потолок 4,6 × 4,3 − 1,5 × 1,2 = 19,78 − 1,8 = 17,98 м²",
      },
    },
    {
      name: "L-shape with the cut-out top left and a door and a window: the corner changes no number",
      input: { shape: "l", cutCorner: "nw" },
      expected: { summary: { wallArea: 44.78, grossWallArea: 48.06, ceilingArea: 17.98 }, warnings: [] },
      source: { kind: "manual", ref: "48,06 − 0,8 × 2 − 1,2 × 1,4 = 44,78 м²; потолок 19,78 − 1,5 × 1,2 = 17,98 м²" },
    },
    {
      name: "Small L-shape 2 × 1.5 × 2.5 m, cut-out 0.6 × 0.5 m",
      input: {
        shape: "l",
        lengthMm: 2000,
        widthMm: 1500,
        heightMm: 2500,
        cutLengthMm: 600,
        cutWidthMm: 500,
        openings: [],
      },
      expected: { summary: { wallArea: 17.5, ceilingArea: 2.7, perimeter: 7 }, warnings: [] },
      source: {
        kind: "manual",
        ref: "Периметр 2 × 3,5 = 7 м; 7 × 2,5 = 17,5 м²; потолок 2 × 1,5 − 0,6 × 0,5 = 2,7 м²",
      },
    },
    {
      name: "Cut-out as wide as the room is counted as a rectangle",
      input: { shape: "l", lengthMm: 4000, widthMm: 3000, cutLengthMm: 1000, cutWidthMm: 3000, openings: [] },
      expected: {
        summary: { wallArea: 37.8, ceilingArea: 12 },
        warnings: ["cut_too_large"],
      },
      source: {
        kind: "manual",
        ref: "Вырез во всю ширину — не Г-образная: 2 × 7 × 2,7 = 37,8 м²; потолок 4 × 3 = 12 м²",
      },
    },
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
      name: "Door taller than the wall → warning, the door cut at the wall's height (v3)",
      input: { lengthMm: 4000, widthMm: 3000, heightMm: 2500, openings: [door(900, 2600)] },
      expected: {
        summary: { wallArea: 32.75, grossWallArea: 35, openingsArea: 2.25 },
        warnings: ["opening_too_tall"],
      },
      source: {
        kind: "manual",
        ref: "formula review 2026-10-21, derived by hand: 14 × 2,5 = 35; дверь 2,6 м выше стены 2,5 м — вычитаем только то, что в стене: 0,9 × 2,5 = 2,25; 35 − 2,25 = 32,75 м² (в v2 вычиталось 0,9 × 2,6 = 2,34 → 32,66)",
      },
    },
    {
      // v3: was one window 3 × 3 m on a 1 m wall (9 m²); cut at the wall's height it takes 3 m² and no longer
      // exceeds the 4 m² of walls, so the case keeps its intent with two windows.
      name: "Openings larger than the walls → zero, not negative",
      input: { lengthMm: 1000, widthMm: 1000, heightMm: 1000, openings: [window(3000, 3000, 2)] },
      expected: {
        summary: { wallArea: 0, grossWallArea: 4, openingsArea: 6 },
        warnings: ["openings_exceed_walls", "opening_too_tall"],
      },
      source: {
        kind: "manual",
        ref: "4 × 1 = 4 м² стен; два окна 3 × 3 м выше стены 1 м — по 3 × 1 = 3 м², вместе 6 м²: площадь стен 0, а не −2",
      },
    },
    {
      name: "Window taller than a low wall: cut at the wall's height (v3)",
      input: { lengthMm: 3000, widthMm: 2500, heightMm: 2000, openings: [window(1500, 2200)] },
      expected: {
        summary: { wallArea: 19, grossWallArea: 22, openingsArea: 3 },
        warnings: ["opening_too_tall"],
      },
      source: {
        kind: "manual",
        ref: "formula review 2026-10-21, derived by hand: 2 × 5,5 × 2 = 22 м²; окно 2,2 м на стене 2 м — 1,5 × 2 = 3 м²; 22 − 3 = 19 м²",
      },
    },
  ],
};
