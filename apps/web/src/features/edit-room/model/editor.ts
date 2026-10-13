import {
  type CutCorner,
  type EstimateCalc,
  type EstimateRoom,
  floorAreaM2,
  mmToM,
  placeOpenings,
  type Room,
  type RoomType,
  wallAreaM2,
} from "@umnyaut/calc";
import { shell, type ToolDef } from "@umnyaut/catalog";
import { type RoomGeometry, type SavedRoom, wallNumbering } from "@/entities/estimate";
import { collapse, expand, type PlanOpening, type PlanRoom, planOutline } from "@/entities/room";

/** What the editor holds while the user types: sizes in mm (`undefined` = empty), one opening per door or window. */
export interface RoomForm {
  name: string;
  type: RoomType;
  shape: "rect" | "l";
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  cutLengthMm: number;
  cutWidthMm: number;
  cutCorner: CutCorner;
  openings: PlanOpening[];
}

/** A new L-shape starts from the usual cut-out of the tools (1,5 × 1,2 м, bottom right). */
const CUT = { cutLengthMm: 1500, cutWidthMm: 1200, cutCorner: "se" as CutCorner };

/**
 * The editor's start: the room, and for what it does not know yet the calculator's `draft` — so the editor shows
 * the sizes, shape and doors the result is counted with.
 */
export function formOf(room: EstimateRoom | null, name: string, draft: RoomGeometry = {}): RoomForm {
  const known: RoomGeometry = {
    ...draft,
    ...Object.fromEntries(Object.entries(room ?? {}).filter(([, v]) => v !== undefined)),
  };
  return {
    name: room?.name ?? name,
    type: room?.type ?? "other",
    shape: known.shape ?? "rect",
    ...(known.lengthMm ? { lengthMm: known.lengthMm } : {}),
    ...(known.widthMm ? { widthMm: known.widthMm } : {}),
    ...(known.heightMm ? { heightMm: known.heightMm } : {}),
    cutLengthMm: known.cutLengthMm || CUT.cutLengthMm,
    cutWidthMm: known.cutWidthMm || CUT.cutWidthMm,
    cutCorner: known.cutCorner ?? CUT.cutCorner,
    openings: expand(known.openings ?? []),
  };
}

/**
 * The room to store: the cut-out only for an L-shape, empty sizes left out, a place on a wall the room no longer has
 * dropped (the opening stays, unplaced).
 */
export function roomOf(form: RoomForm): SavedRoom {
  const l = form.shape === "l";
  const plan = planOf(form);
  const walls = plan ? planOutline(plan).walls.length : Number.POSITIVE_INFINITY;
  const openings = form.openings.map(({ place, ...o }) => (place && place.wall < walls ? { ...o, place } : o));
  return {
    name: form.name.trim(),
    type: form.type,
    shape: form.shape,
    ...(form.lengthMm ? { lengthMm: form.lengthMm } : {}),
    ...(form.widthMm ? { widthMm: form.widthMm } : {}),
    ...(form.heightMm ? { heightMm: form.heightMm } : {}),
    ...(l ? { cutLengthMm: form.cutLengthMm, cutWidthMm: form.cutWidthMm, cutCorner: form.cutCorner } : {}),
    openings: collapse(openings),
  };
}

/** The plan of the form, once length and width are known. */
export function planOf(form: RoomForm): PlanRoom | undefined {
  if (!form.lengthMm || !form.widthMm) return undefined;
  const l =
    form.shape === "l" &&
    form.cutLengthMm > 0 &&
    form.cutWidthMm > 0 &&
    form.cutLengthMm < form.lengthMm &&
    form.cutWidthMm < form.widthMm;
  return {
    lengthMm: form.lengthMm,
    widthMm: form.widthMm,
    ...(l ? { cut: { lengthMm: form.cutLengthMm, widthMm: form.cutWidthMm } } : {}),
    cutCorner: form.cutCorner,
  };
}

/** Floor, perimeter, walls without openings and ceiling, as the room area and wall area tools count them. */
export function totalsOf(form: RoomForm) {
  const plan = planOf(form);
  if (!plan) return undefined;
  const room: Room = {
    shape: plan.cut ? "l" : "rect",
    lengthMm: plan.lengthMm,
    widthMm: plan.widthMm,
    heightMm: form.heightMm ?? 0,
    ...(plan.cut ? { cut: plan.cut, cutCorner: plan.cutCorner } : {}),
    openings: collapse(form.openings),
  };
  const floor = floorAreaM2(room);
  return {
    floorM2: floor,
    perimeterM: mmToM(planOutline(plan).walls.reduce((n, w) => n + w.lengthMm, 0)),
    ...(form.heightMm ? { wallsM2: wallAreaM2(room).areaM2 } : {}),
    ceilingM2: floor,
  };
}

/** Doors and windows the plan can draw, with their marks. */
export function marksOf(form: RoomForm) {
  const plan = planOf(form);
  if (!plan) return undefined;
  const { points, walls } = planOutline(plan);
  const { placed } = placeOpenings(walls, collapse(form.openings));
  return { points, walls, marks: placed.map((p) => p.mark) };
}

/** Tool id → its wall-bound input fields, from the catalog. */
export function wallBoundOf(tools: readonly ToolDef[]): Record<string, readonly string[]> {
  return Object.fromEntries(tools.flatMap((t) => (t.wallBound ? [[t.id, t.wallBound.fields]] : [])));
}

/**
 * «Пересчитаем расчёты этой комнаты: Плитка, Обои» and what is reset: the tools of the room's calcs once each, and
 * the tools whose wall-bound fields go back to defaults because the walls are numbered anew (Р10).
 */
export function recalcOf(
  room: EstimateRoom | null,
  form: RoomForm,
  calcs: readonly EstimateCalc[],
  tools: readonly ToolDef[],
) {
  if (!room) return { tools: [], resets: [] };
  const mine = calcs.filter((c) => c.roomId === room.id);
  const used = tools.filter((t) => mine.some((c) => c.tool === t.id));
  const renumbered = wallNumbering(room) !== wallNumbering(roomOf(form));
  const resets = renumbered
    ? used.flatMap((t) =>
        t.wallBound && mine.some((c) => c.tool === t.id && t.wallBound?.fields.some((f) => f in c.input))
          ? [{ tool: t.title, what: t.wallBound.note }]
          : [],
      )
    : [];
  return { tools: used.map((t) => t.title), resets };
}

const TYPES = shell.roomEditor.types;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** «Комната 3», «Спальня», «Спальня 2» — names the editor gave, not the user. */
const AUTO = new RegExp(
  `^(?:${[shell.estimate.room.replace("{n}", "\\d+"), ...Object.values(TYPES).map((t) => `${escape(t)}(?: \\d+)?`)].join("|")})$`,
);

/**
 * The name after a type chip: a name the editor gave (empty, «Комната 3», another type's) becomes the type —
 * «Спальня», or «Спальня 2» when another room has that name; «Другое» goes back to `fallback`. A name the user
 * typed stays.
 */
export function nameForType(type: RoomType, current: string, fallback: string, others: readonly string[]): string {
  if (current.trim() !== "" && !AUTO.test(current.trim())) return current;
  if (type === "other") return fallback;
  const base = TYPES[type];
  const taken = new Set(others);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
