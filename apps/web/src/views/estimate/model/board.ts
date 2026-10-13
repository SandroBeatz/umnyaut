import {
  type Estimate,
  type EstimateAggregate,
  type EstimateLine,
  type EstimateRoom,
  floorAreaM2,
  surfaceParts,
} from "@umnyaut/calc";
import {
  estimatePage,
  itemTitle,
  roomSuggestions,
  shell,
  type ToolDef,
  tools,
  unitLabels,
  workOrder,
} from "@umnyaut/catalog";
import { type Country, formatMoney, formatNumber, NBSP, plural } from "@umnyaut/ui/format";
import { roomDimensions } from "@/entities/room";
import { groupPurchases, purchaseTexts } from "@/entities/tool";
import { fill } from "@/shared/lib";

const t = estimatePage;

/** One calc in its room card: «Ламинат», «пол · + подложка 2 рулона», «10 пачек», its sum. */
export interface CalcRow {
  id: string;
  roomId: string;
  tool: ToolDef;
  title: string;
  caption?: string;
  /** None for a calc whose purchase is all shared consumables. */
  quantity?: string;
  /** Priced lines only; none without a price. */
  cost?: number;
}

export interface RoomCard {
  room: EstimateRoom;
  /** «4,6 × 4,3 × 2,7 м · 19,8 м²»; none without length and width. */
  size?: string;
  rows: CalcRow[];
  sum: number;
  /** A room with nothing counted: the usual works of its type. */
  suggestions: ToolDef[];
}

export interface SharedRow {
  key: string;
  title: string;
  /** «Ванная, Кухня · вместо 8». */
  from: string;
  quantity: string;
  detail?: string;
  cost?: number;
}

export interface EstimateBoard {
  /** Rooms with calcs, then rooms with nothing counted yet. */
  rooms: RoomCard[];
  empty: RoomCard[];
  shared: SharedRow[];
  sharedSum: number;
  /** «Клей и грунтовка одной партией — на 3 100 ₽ дешевле, чем по комнатам». */
  saving?: string;
  metrics: { rooms: number; floorM2: number; calcs: number; saved?: string };
  total: { sum: number; missing: number; byRoom: { id: string; name: string; sum: number }[] };
}

const toolOf = (id: string) => tools.find((tool) => tool.id === id);
const order = (id: string) => {
  const at = workOrder.indexOf(id as (typeof workOrder)[number]);
  return at === -1 ? workOrder.length : at;
};
/** «пол», «пол и стены». */
const surfaceText = (calc: Estimate["calcs"][number]) =>
  calc.surface
    ? surfaceParts(calc.surface)
        .map((p) => shell.calcs.parts[p].toLowerCase())
        .join(" и ")
    : undefined;
/** «Ванная, Кухня и Зал». */
const listText = (names: readonly string[]) =>
  names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} и ${names.at(-1)}`;

/** A room's floor, as the room area tool counts it; none without length and width. */
export function floorOf(room: EstimateRoom): number | undefined {
  if (!room.lengthMm || !room.widthMm) return undefined;
  const cut = room.shape === "l" && room.cutLengthMm && room.cutWidthMm;
  return floorAreaM2({
    shape: cut ? "l" : "rect",
    lengthMm: room.lengthMm,
    widthMm: room.widthMm,
    heightMm: room.heightMm ?? 0,
    ...(cut ? { cut: { lengthMm: room.cutLengthMm ?? 0, widthMm: room.cutWidthMm ?? 0 } } : {}),
    openings: [],
  });
}

/** «19,8 м²». */
export const areaText = (m2: number) => `${formatNumber(m2, { maxFraction: 1 })}${NBSP}${unitLabels.m2}`;

function rowOf(calc: Estimate["calcs"][number], lines: readonly EstimateLine[], counted: boolean): CalcRow | undefined {
  const tool = toolOf(calc.tool);
  if (!tool || !counted) return undefined;
  const title = calc.label?.trim() ? `${tool.title} · ${calc.label.trim()}` : tool.title;
  const groups = groupPurchases(lines.map((l) => l.item));
  const main = groups.find((g) => g.first.role === "main") ?? groups[0];
  const others = groups.filter((g) => g !== main);
  // One extra with its quantity («+ подложка 2 рулона»); several (plinth fittings) by name only, to stay one line.
  const extras =
    others.length === 1 && others[0]
      ? [
          fill(t.withItem, {
            item: itemTitle(others[0].first, tool).toLowerCase(),
            quantity: purchaseTexts(others[0]).quantity,
          }),
        ]
      : others.length > 1
        ? [`+ ${others.map((g) => itemTitle(g.first, tool).toLowerCase()).join(", ")}`]
        : [];
  const caption = [surfaceText(calc), ...(main ? extras : [t.inShared])].filter(Boolean).join(" · ");
  const priced = lines.filter((l) => l.cost !== undefined);
  return {
    id: calc.id,
    roomId: calc.roomId,
    tool,
    title,
    ...(caption ? { caption } : {}),
    ...(main ? { quantity: purchaseTexts(main).quantity } : {}),
    ...(priced.length > 0 ? { cost: priced.reduce((n, l) => n + (l.cost ?? 0), 0) } : {}),
  };
}

/**
 * The estimate page (spec «Смета», P17.11) from the estimate and its aggregate of the calcs in the estimate: room
 * cards with one row per calc in the order of works, shared consumables with the rooms they come from, metrics and
 * the total.
 */
export function estimateBoard(estimate: Estimate, aggregate: EstimateAggregate, country: Country): EstimateBoard {
  const counted = new Set([
    ...aggregate.rooms.flatMap((r) => r.lines.map((l) => l.calcId)),
    ...aggregate.shared.flatMap((l) => l.shares.map((s) => s.calcId)),
  ]);
  const roomName = (id: string) => estimate.rooms.find((r) => r.id === id)?.name ?? "";

  const cards = estimate.rooms.map((room): RoomCard => {
    const lines = aggregate.rooms.find((r) => r.roomId === room.id)?.lines ?? [];
    const rows = estimate.calcs
      .filter((c) => c.roomId === room.id && c.addedAt !== undefined)
      .map((c, i) => ({ c, i }))
      .sort((a, b) => order(a.c.tool) - order(b.c.tool) || a.i - b.i)
      .flatMap(({ c }) => {
        const row = rowOf(
          c,
          lines.filter((l) => l.calcId === c.id),
          counted.has(c.id),
        );
        return row ? [row] : [];
      });
    const dimensions = roomDimensions(room, unitLabels.m);
    const floor = floorOf(room);
    const here = new Set(estimate.calcs.filter((c) => c.roomId === room.id).map((c) => c.tool));
    return {
      room,
      ...(dimensions ? { size: floor ? fill(t.roomSize, { dimensions, area: areaText(floor) }) : dimensions } : {}),
      rows,
      sum: aggregate.totals.byRoom[room.id] ?? 0,
      suggestions:
        rows.length > 0
          ? []
          : roomSuggestions[room.type].flatMap((id) => {
              const tool = toolOf(id);
              return tool && !here.has(id) ? [tool] : [];
            }),
    };
  });

  const shared = aggregate.shared.map((line): SharedRow => {
    const [group] = groupPurchases([line.item]);
    const texts = group ? purchaseTexts(group) : { quantity: "" };
    const rooms = listText([...new Set(line.shares.map((s) => roomName(s.roomId)))]);
    return {
      key: line.productKey,
      title: itemTitle(line.item),
      from: line.savedPacks > 0 ? `${rooms} · ${fill(t.shared.instead, { count: line.separatePacks })}` : rooms,
      quantity: texts.quantity,
      ...(texts.detail ? { detail: texts.detail } : {}),
      ...(line.cost === undefined ? {} : { cost: line.cost }),
    };
  });

  const { saved, savedPacks } = aggregate.totals;
  const savers = [...new Set(aggregate.shared.filter((l) => l.savedPacks > 0).map((l) => itemTitle(l.item)))];
  const items = listText(savers);
  const savedText =
    saved > 0
      ? formatMoney(saved, country)
      : savedPacks > 0
        ? `${savedPacks}${NBSP}${plural(savedPacks, t.shared.packs)}`
        : undefined;
  const saving =
    savers.length === 0
      ? undefined
      : saved > 0
        ? fill(t.shared.saving, { items, saved: formatMoney(saved, country) })
        : fill(t.shared.savingPacks, { items, count: savedPacks, packs: plural(savedPacks, t.shared.packs) });

  const rooms = cards.filter((c) => c.rows.length > 0);
  const sharedSum = aggregate.shared.reduce((n, l) => n + (l.cost ?? 0), 0);
  return {
    rooms,
    empty: cards.filter((c) => c.rows.length === 0),
    shared,
    sharedSum,
    ...(saving ? { saving } : {}),
    metrics: {
      rooms: estimate.rooms.length,
      floorM2: estimate.rooms.reduce((n, r) => n + (floorOf(r) ?? 0), 0),
      calcs: rooms.reduce((n, c) => n + c.rows.length, 0),
      ...(savedText ? { saved: savedText } : {}),
    },
    total: {
      sum: aggregate.totals.sum,
      missing: aggregate.totals.missing,
      byRoom: [
        ...rooms.map((c) => ({ id: c.room.id, name: c.room.name, sum: c.sum })),
        ...(shared.length > 0 ? [{ id: "shared", name: t.total.shared, sum: sharedSum }] : []),
      ],
    },
  };
}
