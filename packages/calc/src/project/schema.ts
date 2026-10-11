import * as z from "zod/mini";
import { cutCornerSchema, openingPlacesSchema } from "../blocks/plan";

/** Integer millimetres, 0 … 100 m: wider than any room, narrower than nonsense. */
const mm = z.int().check(z.minimum(0), z.maximum(100_000));

export const openingSchema = z.object({
  type: z.enum(["door", "window"]),
  widthMm: mm,
  heightMm: mm,
  count: z.int().check(z.minimum(0), z.maximum(50)),
  places: z.optional(openingPlacesSchema),
});

/** Zod twin of `Room` in ../types — the shape stored in projects and in `umnyaut:room:v1`. */
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

export const projectWorkSchema = z.object({
  tool: z.string().check(z.regex(/^[a-z0-9-]+$/)),
  /** Formula version at save time; a newer one shows «Расчёт обновлён». */
  toolVersion: z.int().check(z.minimum(0)),
  /** Only fields that differ from the tool's defaults. */
  input: z.record(z.string(), z.unknown()),
  /** Pack price by item key. */
  prices: z.optional(z.record(z.string(), z.number().check(z.minimum(0)))),
});

export const projectRoomSchema = z.object({
  id: z.string().check(z.minLength(1), z.maxLength(32)),
  name: z.string().check(z.maxLength(60)),
  room: roomSchema,
  works: z.array(projectWorkSchema).check(z.maxLength(30)),
});

/** Light master mode arrives at stage 3; the field is reserved now and kept as is. */
export const masterSheetSchema = z.looseObject({});

export const projectDataSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.optional(z.string().check(z.maxLength(80))),
  country: countrySchema,
  /** Exactly one room in planner v1; v2 allows several. */
  rooms: z.array(projectRoomSchema).check(z.length(1)),
  master: z.optional(masterSheetSchema),
});

export type ProjectData = z.infer<typeof projectDataSchema>;
export type ProjectWork = z.infer<typeof projectWorkSchema>;
export type ProjectRoom = z.infer<typeof projectRoomSchema>;

export const PROJECT_SCHEMA_VERSION = 1;

export type MigrateResult = { ok: true; data: ProjectData } | { ok: false; error: "unknown_version" | "invalid" };

/**
 * Brings stored project data to the current schema. The server returns data as is; the browser calls this on open.
 * v1 is the only version so far, so this validates; each future version adds one step `vN → vN+1` here.
 */
export function migrateProject(raw: unknown): MigrateResult {
  const version = (raw as { schemaVersion?: unknown } | null)?.schemaVersion;
  if (version !== PROJECT_SCHEMA_VERSION) return { ok: false, error: "unknown_version" };
  const parsed = projectDataSchema.safeParse(raw);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: "invalid" };
}
