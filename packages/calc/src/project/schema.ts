import * as z from "zod/mini";
import { cutCornerSchema, openingPlacesSchema } from "../blocks/plan";

/** Integer millimetres, 0 … 100 m: wider than any room, narrower than nonsense. */
const mm = z.int().check(z.minimum(0), z.maximum(100_000));
/** A room size the user entered: never zero. */
const size = z.int().check(z.positive(), z.maximum(100_000));
const id = z.string().check(z.minLength(1), z.maxLength(32));
const toolId = z.string().check(z.regex(/^[a-z0-9-]+$/));
/** Milliseconds since 1970 — set by the browser; calc never reads the clock. */
const time = z.int().check(z.minimum(0));
const price = z.number().check(z.minimum(0));

export const openingSchema = z.object({
  type: z.enum(["door", "window"]),
  widthMm: mm,
  heightMm: mm,
  count: z.int().check(z.minimum(0), z.maximum(50)),
  places: z.optional(openingPlacesSchema),
});

/** Zod twin of `Room` in ../types — the room of project schema 1. */
export const roomSchema = z.object({
  shape: z.enum(["rect", "l", "polygon"]),
  lengthMm: mm,
  widthMm: mm,
  heightMm: mm,
  cut: z.optional(z.object({ lengthMm: mm, widthMm: mm })),
  cutCorner: z.optional(cutCornerSchema),
  points: z.optional(z.readonly(z.array(z.readonly(z.tuple([mm, mm]))).check(z.maxLength(200)))),
  openings: z.readonly(z.array(openingSchema).check(z.maxLength(50))),
});

export const countrySchema = z.enum(["RU", "KZ", "BY", "KG"]);

/** Light master mode arrives at stage 3; the field is reserved now and kept as is. */
export const masterSheetSchema = z.looseObject({});

const projectWorkV1Schema = z.object({
  tool: toolId,
  toolVersion: z.int().check(z.minimum(0)),
  input: z.record(z.string(), z.unknown()),
  prices: z.optional(z.record(z.string(), price)),
});

/** Schema 1: the planner's single room with its works. Read only to migrate. */
const projectDataV1Schema = z.object({
  schemaVersion: z.literal(1),
  title: z.optional(z.string().check(z.maxLength(80))),
  country: countrySchema,
  rooms: z.array(
    z.object({
      id,
      name: z.string().check(z.maxLength(60)),
      room: roomSchema,
      works: z.array(projectWorkV1Schema).check(z.maxLength(30)),
    }),
  ),
  master: z.optional(masterSheetSchema),
});

/** Limits of one estimate (spec «Данные и хранение»). */
export const ESTIMATE_LIMITS = { rooms: 20, calcs: 60, name: 40, estimateName: 80, label: 40, openings: 20 } as const;

/** Room types; a type only suggests what to count next, it never changes a formula. */
export const roomTypeSchema = z.enum(["living", "bedroom", "kitchen", "bathroom", "hall", "other"]);

/**
 * A room as the user has measured it so far. Sizes are optional: the room area tool knows no height and a room is
 * created at the first size entered. The L-cut is kept flat (`cutLengthMm`, `cutWidthMm`) like the tool fields it
 * binds to.
 */
export const estimateRoomSchema = z.object({
  id,
  /** Empty → the UI shows «Комната N». */
  name: z.string().check(z.maxLength(ESTIMATE_LIMITS.name)),
  type: roomTypeSchema,
  shape: z.optional(z.enum(["rect", "l"])),
  lengthMm: z.optional(size),
  widthMm: z.optional(size),
  heightMm: z.optional(size),
  cutLengthMm: z.optional(mm),
  cutWidthMm: z.optional(mm),
  cutCorner: z.optional(cutCornerSchema),
  openings: z.optional(z.readonly(z.array(openingSchema).check(z.maxLength(ESTIMATE_LIMITS.openings)))),
});

/**
 * Surface a calc covers. A tool's own «both» is spelled out: tile's «Пол и стены» is `floor-walls`, paint's «Стены
 * и потолок» is `walls-ceiling`.
 */
export const surfaceSchema = z.enum(["floor", "walls", "ceiling", "floor-walls", "walls-ceiling"]);

export const estimateCalcSchema = z.object({
  id,
  roomId: id,
  tool: toolId,
  /** Formula version at save time; a newer one shows «Расчёт обновлён». 0 = not known (moved from the old list). */
  toolVersion: z.int().check(z.minimum(0)),
  surface: z.optional(surfaceSchema),
  /** «белая глянцевая» — shown in chips, the estimate and print. */
  label: z.optional(z.string().check(z.maxLength(ESTIMATE_LIMITS.label))),
  /** Only material fields that differ from the tool's defaults; room fields live in the room. */
  input: z.record(z.string(), z.unknown()),
  /** Main-material pack price by item key; shared consumables are priced in the estimate. */
  prices: z.optional(z.record(z.string(), price)),
  openedAt: time,
  /** Set once «Добавить в смету» put the calc in the estimate (Р4); unset = a draft not counted. */
  addedAt: z.optional(time),
  /**
   * Edits made in the calculator after the calc is in the estimate, not yet saved by «Обновить в смете» (owner,
   * 2026-10-13): the estimate keeps counting `input` until then.
   */
  draft: z.optional(z.record(z.string(), z.unknown())),
});

/** The estimate total kept for the header, so the header never loads calculators (Р3). */
export const estimateTotalsSchema = z.object({
  sum: price,
  byRoom: z.record(z.string(), price),
  /** Money saved by merging shared consumables (priced ones only). */
  saved: price,
  /** Lines without a price. */
  missing: z.int().check(z.minimum(0)),
  at: time,
});

const unique = (values: readonly string[]) => new Set(values).size === values.length;

export const projectDataSchema = z
  .object({
    schemaVersion: z.literal(2),
    id,
    name: z.string().check(z.maxLength(ESTIMATE_LIMITS.estimateName)),
    country: countrySchema,
    rooms: z.array(estimateRoomSchema).check(z.maxLength(ESTIMATE_LIMITS.rooms)),
    calcs: z.array(estimateCalcSchema).check(z.maxLength(ESTIMATE_LIMITS.calcs)),
    /** Shared-consumable pack price by product key (Р2). */
    prices: z.record(z.string(), price),
    totals: z.optional(estimateTotalsSchema),
    activeRoomId: z.optional(id),
    updatedAt: time,
    master: z.optional(masterSheetSchema),
  })
  .check(
    z.refine((e) => unique(e.rooms.map((r) => r.id)) && unique(e.calcs.map((c) => c.id)), {
      message: "duplicate id",
    }),
    z.refine((e) => e.calcs.every((c) => e.rooms.some((r) => r.id === c.roomId)), { message: "calc without room" }),
    z.refine((e) => e.activeRoomId === undefined || e.rooms.some((r) => r.id === e.activeRoomId), {
      message: "unknown active room",
    }),
  );

/** Project schema 2 = the estimate: rooms, their calcs and the shared consumables' prices. */
export type ProjectData = z.infer<typeof projectDataSchema>;
export type Estimate = ProjectData;
export type EstimateRoom = z.infer<typeof estimateRoomSchema>;
export type EstimateCalc = z.infer<typeof estimateCalcSchema>;
export type EstimateTotals = z.infer<typeof estimateTotalsSchema>;
export type RoomType = z.infer<typeof roomTypeSchema>;
export type Surface = z.infer<typeof surfaceSchema>;

export const PROJECT_SCHEMA_VERSION = 2;

export type MigrateResult = { ok: true; data: ProjectData } | { ok: false; error: "unknown_version" | "invalid" };

/** The next free id with the prefix: `r1`, `r2`, … — pure, so the same estimate always gets the same ids. */
export function nextId(prefix: string, taken: readonly { id: string }[]): string {
  const used = new Set(taken.map((t) => t.id));
  let n = taken.length + 1;
  while (used.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/**
 * Schema 1 → 2: each planner room becomes an estimate room (type «other», a polygon its bounding rectangle — v2
 * draws rectangles and L-shapes only), each work a calc of it, already in the estimate. Work prices stay with the
 * calc. Rooms and calcs past the limits are dropped.
 */
function fromV1(v1: z.infer<typeof projectDataV1Schema>): ProjectData {
  const rooms = v1.rooms.slice(0, ESTIMATE_LIMITS.rooms);
  const calcs: EstimateCalc[] = [];
  for (const r of rooms) {
    for (const w of r.works) {
      calcs.push({
        id: `c${calcs.length + 1}`,
        roomId: r.id,
        tool: w.tool,
        toolVersion: w.toolVersion,
        input: w.input,
        ...(w.prices ? { prices: w.prices } : {}),
        openedAt: 0,
        addedAt: 0,
      });
    }
  }
  return {
    schemaVersion: 2,
    id: "e1",
    name: v1.title ?? "",
    country: v1.country,
    rooms: rooms.map(({ id, name, room }): EstimateRoom => {
      const cut = room.shape === "l" ? room.cut : undefined;
      return {
        id,
        name: name.slice(0, ESTIMATE_LIMITS.name),
        type: "other",
        shape: cut ? "l" : "rect",
        ...(room.lengthMm > 0 ? { lengthMm: room.lengthMm } : {}),
        ...(room.widthMm > 0 ? { widthMm: room.widthMm } : {}),
        ...(room.heightMm > 0 ? { heightMm: room.heightMm } : {}),
        ...(cut ? { cutLengthMm: cut.lengthMm, cutWidthMm: cut.widthMm } : {}),
        ...(cut && room.cutCorner ? { cutCorner: room.cutCorner } : {}),
        openings: room.openings.slice(0, ESTIMATE_LIMITS.openings),
      };
    }),
    calcs: calcs.slice(0, ESTIMATE_LIMITS.calcs),
    prices: {},
    updatedAt: 0,
    ...(v1.master ? { master: v1.master } : {}),
  };
}

/**
 * Brings stored project data to the current schema. The server returns data as is; the browser calls this on open.
 * Each version adds one step `vN → vN+1` here.
 */
export function migrateProject(raw: unknown): MigrateResult {
  const version = (raw as { schemaVersion?: unknown } | null)?.schemaVersion;
  let data: unknown = raw;
  if (version === 1) {
    const v1 = projectDataV1Schema.safeParse(raw);
    if (!v1.success) return { ok: false, error: "invalid" };
    data = fromV1(v1.data);
  } else if (version !== PROJECT_SCHEMA_VERSION) {
    return { ok: false, error: "unknown_version" };
  }
  const parsed = projectDataSchema.safeParse(data);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: "invalid" };
}
