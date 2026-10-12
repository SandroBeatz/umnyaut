import type { z } from "zod/mini";

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
  kind: "pack" | "roll" | "bag" | "bucket" | "can" | "canister" | "box" | "piece" | "plank" | "running" | "tube";
  size: Quantity;
  /**
   * Roll width of goods sold by the running metre (`kind: "running"`): `size` is then the area of one cut
   * step (width × step), so needs of different widths stay comparable in m².
   */
  width?: Quantity;
}

/** Where one opening sits on the plan: wall index along the outline (clockwise from the top-left corner). */
export interface OpeningPlace {
  wall: number;
  /** From the wall's first corner (clockwise) to the opening's near edge, mm. */
  offsetMm: number;
  /** Windows: from the floor to the bottom of the opening, mm (default `WINDOW_SILL_MM`). Doors stand on the floor. */
  sillMm?: number;
}

export interface Opening {
  type: "door" | "window";
  widthMm: number;
  heightMm: number;
  count: number;
  /**
   * One per counted opening, optional. The plan and the laying guide use them; wall tiling counts the tiles
   * around the openings exactly once all of them are placed.
   */
  places?: readonly OpeningPlace[];
}

/** Corner of the plan the L-shape's cut-out sits in (x along the length to the right, y along the width down). */
export type CutCorner = "ne" | "se" | "sw" | "nw";

/** “My room”. `cut` is the corner cut-out of an L-shaped room; `points` is a free contour (planner v2). */
export interface Room {
  shape: "rect" | "l" | "polygon";
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  cut?: { lengthMm: number; widthMm: number };
  /** Plan position of the cut-out; default `se`. */
  cutCorner?: CutCorner;
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

/** A piece on the plan, mm, plan frame: x along the room length to the right, y along the width down. */
export interface LayoutPiece {
  x: number;
  y: number;
  w: number;
  h: number;
  cut: boolean;
  /** Made from an offcut of another row or sheet (the orange dot). */
  reused?: boolean;
  /** Row or sheet index in laying order (wallpaper: full-height strip number − 1). */
  row?: number;
  /** Wallpaper: number of the pieces column above or below an opening («К1»). */
  piece?: number;
}

/** Something drawn on the outline: a placed door or window, the start corner, a seam. */
export interface LayoutMark {
  kind: "door" | "window" | "start" | "seam";
  /** Wall index (doors, windows) — the UI shows it 1-based. */
  wall?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A wall of the outline, clockwise; `side` is the way it faces the room's inside from. */
export interface PlanWall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lengthMm: number;
  side: "top" | "right" | "bottom" | "left";
}

/** One row of a row layout (laminate): what to cut and where every piece comes from. */
export interface LayoutRow {
  /** Row length between the gaps, mm. */
  lengthMm: number;
  /** Row width across, mm (narrower than a board in the last row). */
  widthMm: number;
  start: number;
  /** `whole` board, a board `cut` to shift the joints, an offcut from the `pool` of another row. */
  startFrom: "whole" | "cut" | "pool";
  /** Row the reused start piece came from (0-based). */
  startFromRow?: number;
  /** Left part of a board cut for the start, and the row it ends (none = waste). */
  startRest?: number;
  startRestToRow?: number;
  /** Whole boards between the start and the end piece. */
  whole: number;
  /** End piece, 0 when the row ends on a whole board or is one piece. */
  end: number;
  endFrom: "new" | "pool" | "none";
  endFromRow?: number;
  /** What is left of the board the end piece was cut from, and the row it starts (none = waste). */
  rest?: number;
  restToRow?: number;
}

/** One sheet of a strip layout (linoleum), in laying order: what to cut from the roll. */
export interface LayoutSheet {
  /** Cut from the roll, mm: the room along the sheet plus allowance, plus the pattern repeat after the first. */
  lengthMm: number;
  /** Part of the roll width left on the floor after the seams and the walls are trimmed, mm. */
  floorWidthMm: number;
  /** Lies wholly in the narrow part of an L-shaped room, so it is cut shorter. */
  short: boolean;
}

/** One straight run of an outline layout (plinth): a wall or its part between corners and doors. */
export interface LayoutRun {
  /** Wall index (the UI shows it 1-based). */
  wall: number;
  lengthMm: number;
  /** Pieces along the run in laying order: a `whole` plank, one `cut` from a new plank, the `rest` of the plank before. */
  pieces: readonly { lengthMm: number; plank: number; from: "whole" | "cut" | "rest" }[];
  /** Left of the last plank after this run: it starts the next run (the last run: spare). */
  carryMm: number;
}

/** A door or a window on an unfolded wall, mm: x from the wall's first corner, y down from the ceiling. */
export interface ElevationOpening {
  type: "door" | "window";
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * One wall unfolded (wall tiling), seen from the room: x from the wall's first corner (on the left), y down from
 * the ceiling, mm. Pieces are the tiles the purchase counted on this wall.
 */
export interface LayoutElevation {
  /** Wall index (the UI shows it 1-based). */
  wall: number;
  lengthMm: number;
  heightMm: number;
  pieces: readonly LayoutPiece[];
  openings: readonly ElevationOpening[];
  /** Tiles: widths of the cut tiles at the wall's corners and at the floor or the ceiling, mm (none, one or two each). */
  cutColumns?: readonly number[];
  cutRows?: readonly number[];
  /** Tiles cut around doors and windows. */
  aroundOpenings?: number;
  /** Wallpaper: the strips on this wall, in hanging order. */
  strips?: LayoutWallStrips;
}

/** Wallpaper on one wall: what is hung where. */
export interface LayoutWallStrips {
  /** Full-height strip numbers, 1-based: the first and the last one hung on this wall (none when there is none). */
  first?: number;
  last?: number;
  /** The rest of strip `carryFrom` from the wall before, at the corner, mm wide. */
  carryFrom?: number;
  carryInMm?: number;
  /** The level line: the edge of the first new strip away from the corner, mm from the wall's first corner. */
  plumbMm: number;
  /** The corner strip: its width on this wall, and the rest going on to the next wall (0 — waste). */
  cornerMm?: number;
  carryOutMm?: number;
  /** Pieces above and below the openings: pieces column number («К1»), where, cut length with the trim. */
  pieces: readonly { n: number; where: "above" | "below"; lengthMm: number }[];
}

/** One roll of a wallpaper layout: what to cut from it in order, and the tail left. */
export interface LayoutRoll {
  /** A full-height `strip` by its number, or a piece of pieces column `piece` («К1») above or below an opening. */
  cuts: readonly { strip?: number; piece?: number; lengthMm: number; where?: "above" | "below" }[];
  tailMm: number;
}

/** Geometry for the single `LayoutScheme` SVG component; text for `guide` codes lives in catalog. */
export interface Layout {
  kind: "rows" | "grid" | "strips" | "points" | "outline";
  widthMm: number;
  heightMm: number;
  /** Room contour, clockwise from the top-left corner. */
  outline: readonly (readonly [number, number])[];
  walls: readonly PlanWall[];
  pieces: readonly LayoutPiece[];
  marks: readonly LayoutMark[];
  rows?: readonly LayoutRow[];
  sheets?: readonly LayoutSheet[];
  runs?: readonly LayoutRun[];
  /** Wall tiling: every wall unfolded; `pieces` is then empty and the plan only shows where the walls are. */
  elevations?: readonly LayoutElevation[];
  /** Wallpaper: the roll cut map. */
  rolls?: readonly LayoutRoll[];
  /** Laying steps in order: code + numbers. */
  guide: readonly Step[];
  stats: { whole: number; cut: number; reused: number; wasteM2: number };
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
  input: z.ZodMiniType<I>;
  defaults(ctx: CalcContext): I;
  /** Never throws on schema-valid input: doubtful input gives a warning. */
  compute(input: I, ctx: CalcContext): R;
}
