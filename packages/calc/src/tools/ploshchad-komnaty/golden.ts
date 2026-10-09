import type { GoldenFile } from "../../golden";
import type { PloshchadKomnatyInput } from "./index";

/**
 * Plane geometry only, so every source is a hand derivation: S = L × W, L-shape S = L × W − a × b,
 * niche +l × d, protrusion −l × d; P = 2 × (L + W) (an L-shape keeps its bounding perimeter), +2 × d per niche
 * or protrusion. Lengths are entered in mm.
 */
export const golden: GoldenFile<PloshchadKomnatyInput> = {
  tool: "ploshchad-komnaty",
  examples: [
    {
      name: "Mockup room 4.6 × 4.3 m (defaults)",
      input: {},
      expected: { summary: { floorArea: 19.78, perimeter: 17.8 }, warnings: [] },
      source: { kind: "manual", ref: "4,6 × 4,3 = 19,78 м²; 2 × (4,6 + 4,3) = 17,8 м" },
    },
    {
      name: "Square 3 × 3 m",
      input: { lengthMm: 3000, widthMm: 3000 },
      expected: { summary: { floorArea: 9, perimeter: 12 }, warnings: [] },
      source: { kind: "manual", ref: "3 × 3 = 9 м²; 2 × 6 = 12 м" },
    },
    {
      name: "Centimetre precision 5.25 × 3.78 m",
      input: { lengthMm: 5250, widthMm: 3780 },
      expected: { summary: { floorArea: 19.845, perimeter: 18.06 } },
      source: { kind: "manual", ref: "5,25 × 3,78 = 19,845 м²; 2 × 9,03 = 18,06 м" },
    },
    {
      name: "Millimetre input 3.45 × 2.87 m",
      input: { lengthMm: 3450, widthMm: 2870 },
      expected: { summary: { floorArea: 9.9015, perimeter: 12.64 } },
      source: { kind: "manual", ref: "3,45 × 2,87 = 9,9015 м²; 2 × 6,32 = 12,64 м" },
    },
    {
      name: "Small storeroom 1.5 × 1.2 m",
      input: { lengthMm: 1500, widthMm: 1200 },
      expected: { summary: { floorArea: 1.8, perimeter: 5.4 }, warnings: [] },
      source: { kind: "manual", ref: "1,5 × 1,2 = 1,8 м²; 2 × 2,7 = 5,4 м" },
    },
    {
      name: "Large hall 12 × 8 m",
      input: { lengthMm: 12000, widthMm: 8000 },
      expected: { summary: { floorArea: 96, perimeter: 40 } },
      source: { kind: "manual", ref: "12 × 8 = 96 м²; 2 × 20 = 40 м" },
    },
    {
      name: "L-shape 6 × 4 m minus 2 × 1.5 m",
      input: { shape: "l", lengthMm: 6000, widthMm: 4000, cutLengthMm: 2000, cutWidthMm: 1500 },
      expected: { summary: { floorArea: 21, perimeter: 20 }, warnings: [] },
      source: { kind: "manual", ref: "6 × 4 − 2 × 1,5 = 24 − 3 = 21 м²; 2 × (6 + 4) = 20 м" },
    },
    {
      name: "Cut-out ignored for a rectangle",
      input: { shape: "rect", cutLengthMm: 2000, cutWidthMm: 1500 },
      expected: { summary: { floorArea: 19.78, perimeter: 17.8 }, warnings: [] },
      source: { kind: "manual", ref: "Форма «прямоугольник»: вырез не учитывается, 4,6 × 4,3 = 19,78 м²" },
    },
    {
      name: "Cut-out as long as the room → counted as a rectangle",
      input: { shape: "l", lengthMm: 4000, widthMm: 3000, cutLengthMm: 4000, cutWidthMm: 1000 },
      expected: { summary: { floorArea: 12, perimeter: 14 }, warnings: ["cut_too_large"] },
      source: {
        kind: "manual",
        ref: "Вырез во всю длину — это не Г-форма: считаем 4 × 3 = 12 м² и предупреждаем",
      },
    },
    {
      name: "Niche 1.5 × 0.6 m",
      input: { lengthMm: 4000, widthMm: 3000, nicheLengthMm: 1500, nicheDepthMm: 600 },
      expected: { summary: { floorArea: 12.9, perimeter: 15.2 } },
      source: { kind: "manual", ref: "4 × 3 + 1,5 × 0,6 = 12,9 м²; 14 + 2 × 0,6 = 15,2 м" },
    },
    {
      name: "Column 0.6 × 0.4 m against a wall",
      input: { lengthMm: 4000, widthMm: 3000, protrusionLengthMm: 600, protrusionDepthMm: 400 },
      expected: { summary: { floorArea: 11.76, perimeter: 14.8 } },
      source: { kind: "manual", ref: "4 × 3 − 0,6 × 0,4 = 11,76 м²; 14 + 2 × 0,4 = 14,8 м" },
    },
    {
      name: "L-shape with a niche and a protrusion",
      input: {
        shape: "l",
        lengthMm: 6000,
        widthMm: 4000,
        cutLengthMm: 2000,
        cutWidthMm: 1500,
        nicheLengthMm: 1000,
        nicheDepthMm: 500,
        protrusionLengthMm: 400,
        protrusionDepthMm: 400,
      },
      expected: { summary: { floorArea: 21.34, perimeter: 21.8 }, warnings: [] },
      source: { kind: "manual", ref: "21 + 1 × 0,5 − 0,4 × 0,4 = 21,34 м²; 20 + 2 × 0,5 + 2 × 0,4 = 21,8 м" },
    },
    {
      name: "Protrusion larger than the room → zero area and a warning",
      input: { lengthMm: 2000, widthMm: 1000, protrusionLengthMm: 2000, protrusionDepthMm: 1000 },
      expected: { summary: { floorArea: 0 }, warnings: ["protrusion_too_large"] },
      source: { kind: "manual", ref: "2 × 1 − 2 × 1 = 0: выступ занимает всю комнату, площадь не уходит в минус" },
    },
  ],
};
