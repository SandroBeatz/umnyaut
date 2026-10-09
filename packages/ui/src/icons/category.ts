import { createLucideIcon } from "lucide-react";

// Custom category icons in Lucide style (24 grid, 2 px stroke, round caps). Drafts until G03 is approved.

/** Room plan: «Основа» (areas, room). */
export const IconOsnova = createLucideIcon("Osnova", [
  ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", key: "frame" }],
  ["path", { d: "M3 12h5", key: "wall-a" }],
  ["path", { d: "M12 3v6", key: "wall-b" }],
  ["path", { d: "M12 13v8", key: "wall-c" }],
  ["path", { d: "M16 12h5", key: "wall-d" }],
]);

/** Floor planks in perspective: «Пол». */
export const IconPol = createLucideIcon("Pol", [
  ["path", { d: "M6 6h12l4 13H2Z", key: "floor" }],
  ["path", { d: "M10 6 8.7 19", key: "plank-a" }],
  ["path", { d: "M14 6l1.3 13", key: "plank-b" }],
  ["path", { d: "M3.4 14.5h5.8", key: "joint-a" }],
  ["path", { d: "M14.9 10.5h4.4", key: "joint-b" }],
]);

/** Brick wall: «Стены». */
export const IconSteny = createLucideIcon("Steny", [
  ["rect", { x: "3", y: "4", width: "18", height: "16", rx: "2", key: "frame" }],
  ["path", { d: "M3 9.33h18", key: "row-a" }],
  ["path", { d: "M3 14.67h18", key: "row-b" }],
  ["path", { d: "M12 4v5.33", key: "joint-a" }],
  ["path", { d: "M8 9.33v5.34", key: "joint-b" }],
  ["path", { d: "M16 9.33v5.34", key: "joint-c" }],
  ["path", { d: "M12 14.67V20", key: "joint-d" }],
]);

/** Four tiles with joints: «Плитка». */
export const IconPlitka = createLucideIcon("Plitka", [
  ["rect", { x: "3", y: "3", width: "8", height: "8", rx: "1.5", key: "a" }],
  ["rect", { x: "13", y: "3", width: "8", height: "8", rx: "1.5", key: "b" }],
  ["rect", { x: "3", y: "13", width: "8", height: "8", rx: "1.5", key: "c" }],
  ["rect", { x: "13", y: "13", width: "8", height: "8", rx: "1.5", key: "d" }],
]);

export const categoryIcons = {
  osnova: IconOsnova,
  pol: IconPol,
  steny: IconSteny,
  plitka: IconPlitka,
} as const;
