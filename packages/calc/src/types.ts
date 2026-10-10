import type { z } from "zod";

/** Contract from docs/code/calc-engine.md (tech spec §5). Lengths are integer millimetres, areas m², volumes m³. */
export type Country = "RU" | "KZ" | "BY" | "KG";

/** Unit of a quantity. Display text (м², пачка, рулон) lives in `catalog`. */
export type Unit = "mm" | "m" | "m2" | "m3" | "kg" | "l" | "pcs";

export interface Quantity {
  value: number;
  unit: Unit;
}

/** How the item is sold. `kind` picks the noun in catalog (пачка, рулон, мешок…); `size` is what one holds. */
export interface Pack {
  kind: "pack" | "roll" | "bag" | "bucket" | "can" | "canister" | "box" | "piece" | "plank" | "tube";
  size: Quantity;
}

export interface Opening {
  type: "door" | "window";
  widthMm: number;
  heightMm: number;
  count: number;
}

/** “My room”. `cut` is the corner cut-out of an L-shaped room; `points` is a free contour (planner v2). */
export interface Room {
  shape: "rect" | "l" | "polygon";
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  cut?: { lengthMm: number; widthMm: number };
  points?: readonly (readonly [number, number])[];
  openings: readonly Opening[];
}

export interface CalcContext {
  room?: Room;
  country: Country;
}

export interface PurchaseItem {
  /** 'laminate' | 'underlay' | 'plinth' — also the photo key and the merge key in the planner. */
  key: string;
  role: "main" | "related";
  need: Quantity;
  pack: Pack;
  /** Packages to buy, always an integer from `ceilPacks()`. */
  packs: number;
  bought: Quantity;
  leftover: Quantity;
  shopQuery?: string;
  nextTool?: string;
}

/** Total when pack prices are entered. `missing` lists item keys without a price («без N позиций»). */
export interface Cost {
  total: number;
  perM2?: number;
  missing: readonly string[];
}

/** Codes and numbers only; Russian text for each code lives in `catalog`. */
export interface Warning {
  code: string;
  level: "info" | "warning";
  values?: Readonly<Record<string, number>>;
}

/** One line of “How calculated”: catalog turns the code + numbers into «Площадь = 4,6 × 4,3 = 19,78 м²». */
export interface Step {
  code: string;
  values: Readonly<Record<string, number>>;
}

export interface LayoutPiece {
  x: number;
  y: number;
  w: number;
  h: number;
  cut: boolean;
  reused?: boolean;
}

/** Geometry for the single `LayoutScheme` SVG component. */
export interface Layout {
  kind: "rows" | "grid" | "strips" | "points" | "outline";
  widthMm: number;
  heightMm: number;
  pieces: readonly LayoutPiece[];
  stats: { whole: number; cut: number; wasteM2: number };
}

export interface ToolResult {
  items: readonly PurchaseItem[];
  summary: readonly (Quantity & { key: string })[];
  cost?: Cost;
  warnings: readonly Warning[];
  steps: readonly Step[];
  layout?: Layout;
}

export interface ToolModule<I = unknown, R extends ToolResult = ToolResult> {
  id: string;
  /** Bump when the formula changes. 0 = placeholder without a formula (no golden examples required yet). */
  version: number;
  input: z.ZodType<I>;
  defaults(ctx: CalcContext): I;
  /** Never throws on schema-valid input: doubtful input gives a warning. */
  compute(input: I, ctx: CalcContext): R;
}
