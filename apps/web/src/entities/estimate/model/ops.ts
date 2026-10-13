import {
  ESTIMATE_LIMITS,
  type Estimate,
  type EstimateCalc,
  type EstimateRoom,
  type EstimateTotals,
  nextId,
  PROJECT_SCHEMA_VERSION,
  type Surface,
} from "@umnyaut/calc";
import { DEFAULT_COUNTRY, shell } from "@umnyaut/catalog";
import { fill } from "@/shared/lib";

/**
 * Pure steps on the estimate (spec «Комнаты и смета», P17.3): each takes the estimate and the time and returns a
 * new one, so the store stays a thin wrapper and every rule is tested here. Limits are kept: past them a step
 * returns the estimate unchanged.
 */

/** What a room knows about its shape — the part the tool fields bind to. */
export type RoomGeometry = Omit<EstimateRoom, "id" | "name" | "type">;

const GEOMETRY: readonly (keyof RoomGeometry)[] = [
  "shape",
  "lengthMm",
  "widthMm",
  "heightMm",
  "cutLengthMm",
  "cutWidthMm",
  "cutCorner",
  "openings",
];

/** The patch without `undefined` values: a tool that knows no height never erases the room's. */
function defined<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function createEstimate(id: string, now: number): Estimate {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id,
    name: shell.estimate.name,
    country: DEFAULT_COUNTRY,
    rooms: [],
    calcs: [],
    prices: {},
    updatedAt: now,
  };
}

/** «Комната N» by the room's place in the estimate; when that name is taken, the first free number. */
export function freeRoomName(rooms: readonly EstimateRoom[]): string {
  const names = new Set(rooms.map((r) => r.name));
  const name = (n: number) => fill(shell.estimate.room, { n });
  let n = rooms.length + 1;
  if (names.has(name(n))) n = 1;
  while (names.has(name(n))) n++;
  return name(n);
}

export function activeRoomOf(estimate: Estimate | null): EstimateRoom | null {
  return estimate?.rooms.find((r) => r.id === estimate.activeRoomId) ?? null;
}

export function addRoom(
  estimate: Estimate,
  patch: RoomGeometry & Partial<Pick<EstimateRoom, "name" | "type">>,
  now: number,
): { estimate: Estimate; id?: string } {
  if (estimate.rooms.length >= ESTIMATE_LIMITS.rooms) return { estimate };
  const id = nextId("r", estimate.rooms);
  const room: EstimateRoom = {
    name: freeRoomName(estimate.rooms),
    type: "other",
    ...defined(patch),
    id,
  };
  return { estimate: { ...estimate, rooms: [...estimate.rooms, room], activeRoomId: id, updatedAt: now }, id };
}

export function updateRoom(
  estimate: Estimate,
  id: string,
  patch: RoomGeometry & Partial<Pick<EstimateRoom, "name" | "type">>,
  now: number,
): Estimate {
  if (!estimate.rooms.some((r) => r.id === id)) return estimate;
  const rooms = estimate.rooms.map((r) => (r.id === id ? { ...r, ...defined(patch), id } : r));
  return { ...estimate, rooms, updatedAt: now };
}

/**
 * How the room's walls are numbered: a rectangle has 4, an L-shape 6 starting from its cut corner. Two rooms with
 * the same value number their walls alike, so wall-bound parameters keep meaning the same walls.
 */
export function wallNumbering(room: RoomGeometry): string {
  const { lengthMm = 0, widthMm = 0, cutLengthMm = 0, cutWidthMm = 0 } = room;
  const l = room.shape === "l" && cutLengthMm > 0 && cutWidthMm > 0 && cutLengthMm < lengthMm && cutWidthMm < widthMm;
  return l ? `l-${room.cutCorner ?? "se"}` : "rect";
}

export type SavedRoom = Omit<EstimateRoom, "id">;

/**
 * The room editor's «Сохранить комнату»: the whole room replaces the stored one (a cleared size is gone), or a new
 * room is added. When the walls are numbered anew, the fields of the room's calcs that point at walls are dropped
 * back to the tool's defaults (`wallBound`: tool id → input fields, spec Р10).
 */
export function saveRoom(
  estimate: Estimate,
  id: string | undefined,
  room: SavedRoom,
  wallBound: Readonly<Record<string, readonly string[]>>,
  now: number,
): { estimate: Estimate; id?: string } {
  const before = estimate.rooms.find((r) => r.id === id);
  if (!before) return addRoom(estimate, room, now);
  const renumbered = wallNumbering(before) !== wallNumbering(room);
  const calcs = estimate.calcs.map((c) => {
    const fields = c.roomId === before.id && renumbered ? wallBound[c.tool] : undefined;
    if (!fields?.some((f) => f in c.input)) return c;
    return { ...c, input: Object.fromEntries(Object.entries(c.input).filter(([k]) => !fields.includes(k))) };
  });
  const rooms = estimate.rooms.map((r) =>
    r.id === before.id ? { ...(defined(room) as SavedRoom), id: before.id } : r,
  );
  return { estimate: { ...estimate, rooms, calcs, updatedAt: now }, id: before.id };
}

/** Forgets the room's sizes and openings; its name, type and calcs stay. */
export function clearRoomGeometry(estimate: Estimate, id: string, now: number): Estimate {
  const rooms = estimate.rooms.map((r) =>
    r.id === id
      ? (Object.fromEntries(
          Object.entries(r).filter(([k]) => !GEOMETRY.includes(k as keyof RoomGeometry)),
        ) as EstimateRoom)
      : r,
  );
  return { ...estimate, rooms, updatedAt: now };
}

/** Removes the room with its calcs; the first room left becomes the active one. */
export function removeRoom(estimate: Estimate, id: string, now: number): Estimate {
  const rooms = estimate.rooms.filter((r) => r.id !== id);
  if (rooms.length === estimate.rooms.length) return estimate;
  const { activeRoomId: _, ...rest } = estimate;
  const active = estimate.activeRoomId === id ? rooms[0]?.id : estimate.activeRoomId;
  return {
    ...rest,
    rooms,
    calcs: estimate.calcs.filter((c) => c.roomId !== id),
    ...(active ? { activeRoomId: active } : {}),
    updatedAt: now,
  };
}

export function setActiveRoom(estimate: Estimate, id: string): Estimate {
  return estimate.rooms.some((r) => r.id === id) ? { ...estimate, activeRoomId: id } : estimate;
}

/**
 * Writes the room-bound part of a tool's input into the active room; with no estimate or no room yet both are
 * created silently (scenario 1: no questions on the first visit).
 */
export function patchActiveRoom(
  estimate: Estimate | null,
  patch: RoomGeometry,
  now: number,
  newId: () => string,
): Estimate {
  const base = estimate ?? createEstimate(newId(), now);
  const active = activeRoomOf(base);
  return active ? updateRoom(base, active.id, patch, now) : addRoom(base, patch, now).estimate;
}

export type NewCalc = Omit<EstimateCalc, "id" | "openedAt">;

export function addCalc(estimate: Estimate, calc: NewCalc, now: number): { estimate: Estimate; id?: string } {
  if (estimate.calcs.length >= ESTIMATE_LIMITS.calcs) return { estimate };
  if (!estimate.rooms.some((r) => r.id === calc.roomId)) return { estimate };
  const id = nextId("c", estimate.calcs);
  return {
    estimate: { ...estimate, calcs: [...estimate.calcs, { ...calc, id, openedAt: now }], updatedAt: now },
    id,
  };
}

/** Changes a calc's input, label, surface or prices; `openedAt` moves to now (the last opened calc wins). */
export function updateCalc(
  estimate: Estimate,
  id: string,
  patch: Partial<Omit<EstimateCalc, "id" | "roomId">>,
  now: number,
): Estimate {
  if (!estimate.calcs.some((c) => c.id === id)) return estimate;
  const calcs = estimate.calcs.map((c) => (c.id === id ? { ...c, ...patch, id, openedAt: now } : c));
  return { ...estimate, calcs, updatedAt: now };
}

/** The calc passed the threshold (Р4) and counts in the estimate from now on. */
export function markAdded(estimate: Estimate, id: string, now: number): Estimate {
  const calc = estimate.calcs.find((c) => c.id === id);
  return !calc || calc.addedAt !== undefined ? estimate : updateCalc(estimate, id, { addedAt: now }, now);
}

export interface Removed {
  calc: EstimateCalc;
  index: number;
}

export function removeCalc(estimate: Estimate, id: string, now: number): { estimate: Estimate; removed?: Removed } {
  const index = estimate.calcs.findIndex((c) => c.id === id);
  const calc = estimate.calcs[index];
  if (!calc) return { estimate };
  return {
    estimate: { ...estimate, calcs: estimate.calcs.filter((c) => c.id !== id), updatedAt: now },
    removed: { calc, index },
  };
}

/** «Вернуть» after a removal: back in its place, unless its room is gone, its id is taken or the estimate is full. */
export function restoreCalc(estimate: Estimate, { calc, index }: Removed, now: number): Estimate {
  if (
    estimate.calcs.length >= ESTIMATE_LIMITS.calcs ||
    estimate.calcs.some((c) => c.id === calc.id) ||
    !estimate.rooms.some((r) => r.id === calc.roomId)
  ) {
    return estimate;
  }
  const calcs = [...estimate.calcs];
  calcs.splice(Math.min(index, calcs.length), 0, calc);
  return { ...estimate, calcs, updatedAt: now };
}

/**
 * «Разделить»: one calc over two surfaces becomes two with the same input — the first keeps `first`, a copy right
 * after it takes `second`.
 */
export function splitCalc(
  estimate: Estimate,
  id: string,
  [first, second]: readonly [Surface, Surface],
  now: number,
): { estimate: Estimate; id?: string } {
  const index = estimate.calcs.findIndex((c) => c.id === id);
  const calc = estimate.calcs[index];
  if (!calc || estimate.calcs.length >= ESTIMATE_LIMITS.calcs) return { estimate };
  const copy: EstimateCalc = { ...calc, id: nextId("c", estimate.calcs), surface: second, openedAt: now };
  const calcs = [...estimate.calcs];
  calcs.splice(index, 1, { ...calc, surface: first }, copy);
  return { estimate: { ...estimate, calcs, updatedAt: now }, id: copy.id };
}

/** Shared-consumable price by product key (Р2); `undefined` removes it. */
export function setPrice(estimate: Estimate, key: string, price: number | undefined, now: number): Estimate {
  const { [key]: _, ...prices } = estimate.prices;
  return { ...estimate, prices: price === undefined ? prices : { ...prices, [key]: price }, updatedAt: now };
}

/** The total the header shows (Р3), saved by the calculator and the estimate page. */
export function setTotals(estimate: Estimate, totals: Omit<EstimateTotals, "at">, now: number): Estimate {
  return { ...estimate, totals: { ...totals, at: now } };
}

/**
 * The room list (P6.11) on top of the estimate until stage C: one calc per tool in the active room, added at once.
 * A second «В список» for the tool replaces its input.
 */
export function putToolCalc(
  estimate: Estimate | null,
  calc: Pick<EstimateCalc, "tool" | "toolVersion" | "input">,
  now: number,
  newId: () => string,
): Estimate {
  const withRoom = activeRoomOf(estimate) ? (estimate as Estimate) : patchActiveRoom(estimate, {}, now, newId);
  const room = activeRoomOf(withRoom);
  if (!room) return withRoom;
  const existing = withRoom.calcs.find((c) => c.roomId === room.id && c.tool === calc.tool);
  if (existing) return updateCalc(withRoom, existing.id, { ...calc, addedAt: existing.addedAt ?? now }, now);
  return addCalc(withRoom, { ...calc, roomId: room.id, addedAt: now }, now).estimate;
}
