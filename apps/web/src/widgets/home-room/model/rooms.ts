import type { Estimate, EstimateCalc, EstimateRoom, RoomType } from "@umnyaut/calc";
import { home, roomSuggestions, type ToolDef, toolPath, tools } from "@umnyaut/catalog";
import { NBSP, plural } from "@umnyaut/ui/format";
import { areaText, floorOf } from "@/entities/room";
import { fill } from "@/shared/lib";

const r = home.rooms;
/** Rooms listed in «Ваш ремонт»; the rest are counted in one «и ещё N» line. */
export const ROOMS_SHOWN = 3;

/** A calc counts once «Добавить в список» put it there (spec Р4). */
const counted = (c: EstimateCalc) => c.addedAt !== undefined;

/** The block shows «Ваш ремонт» once anything is counted; until then it asks for a room. */
export const hasCounted = (estimate: Estimate | null): boolean => estimate?.calcs.some(counted) ?? false;

/** One row of «Ваш ремонт». */
export interface RoomLine {
  id: string;
  name: string;
  type: RoomType;
  /** «19,8 м² · 3 расчёта», «пока ничего не посчитано». */
  meta: string;
  /** The saved total of the room (Р3); 0 — no prices. */
  sum: number;
  /** Where the row leads: the calculator of the room's last opened calc, or its first usual one. */
  href: string;
  /** The calc that opens; none when the room has nothing counted. */
  calcId?: string;
}

/** The room «Посчитать материалы» has just saved: its usual calculators open in a popup. */
export interface SavedRoomRef {
  id: string;
  name: string;
  type: RoomType;
}

/** A type the estimate has no room of yet, so a new room does not start as «Зал 2». */
export function freshType(rooms: readonly Pick<EstimateRoom, "type">[]): RoomType {
  return home.room.types.find((type) => !rooms.some((r) => r.type === type)) ?? "living";
}

/** The usual calculators of a room type, as on the estimate page's empty room. */
export function suggestedTools(type: RoomType): ToolDef[] {
  return roomSuggestions[type].flatMap((id) => {
    const tool = tools.find((t) => t.id === id && t.status === "live");
    return tool ? [tool] : [];
  });
}

function lineOf(estimate: Estimate, room: EstimateRoom): RoomLine {
  const calcs = estimate.calcs.filter((c) => c.roomId === room.id && counted(c));
  const last = calcs.reduce<EstimateCalc | undefined>((a, c) => (!a || c.openedAt >= a.openedAt ? c : a), undefined);
  const tool = last ? tools.find((t) => t.id === last.tool) : suggestedTools(room.type)[0];
  const floor = floorOf(room);
  const count = `${calcs.length}${NBSP}${plural(calcs.length, r.calcForms)}`;
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    meta: calcs.length === 0 ? r.empty : floor ? fill(r.meta, { area: areaText(floor), calcs: count }) : count,
    sum: estimate.totals?.byRoom[room.id] ?? 0,
    href: tool ? toolPath(tool) : "/spisok/",
    ...(last ? { calcId: last.id } : {}),
  };
}

/** Rows of «Ваш ремонт»: the rooms in estimate order, the active one first so it never falls under «и ещё». */
export function roomLines(estimate: Estimate): RoomLine[] {
  const active = estimate.rooms.filter((room) => room.id === estimate.activeRoomId);
  const rest = estimate.rooms.filter((room) => room.id !== estimate.activeRoomId);
  return [...active, ...rest].map((room) => lineOf(estimate, room));
}

/** «2 комнаты». */
export const roomCount = (count: number) => fill(r.count, { count, rooms: plural(count, r.roomForms) });
