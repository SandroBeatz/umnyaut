import { z } from "zod";

/** Integer millimetres, 0 … 100 m: wider than any room, narrower than nonsense. */
const mm = z.number().int().min(0).max(100_000);

export const openingSchema = z.object({
  type: z.enum(["door", "window"]),
  widthMm: mm,
  heightMm: mm,
  count: z.number().int().min(0).max(50),
});

/** Zod twin of `Room` in ../types — the shape stored in projects and in `umnyaut:room:v1`. */
export const roomSchema = z.object({
  shape: z.enum(["rect", "l", "polygon"]),
  lengthMm: mm,
  widthMm: mm,
  heightMm: mm,
  cut: z.object({ lengthMm: mm, widthMm: mm }).optional(),
  points: z
    .array(z.tuple([mm, mm]).readonly())
    .max(200)
    .readonly()
    .optional(),
  openings: z.array(openingSchema).max(50).readonly(),
});

export const countrySchema = z.enum(["RU", "KZ", "BY", "KG"]);

export const projectWorkSchema = z.object({
  tool: z.string().regex(/^[a-z0-9-]+$/),
  /** Formula version at save time; a newer one shows «Расчёт обновлён». */
  toolVersion: z.number().int().min(0),
  /** Only fields that differ from the tool's defaults. */
  input: z.record(z.string(), z.unknown()),
  /** Pack price by item key. */
  prices: z.record(z.string(), z.number().min(0)).optional(),
});

export const projectRoomSchema = z.object({
  id: z.string().min(1).max(32),
  name: z.string().max(60),
  room: roomSchema,
  works: z.array(projectWorkSchema).max(30),
});

/** Light master mode arrives at stage 3; the field is reserved now and kept as is. */
export const masterSheetSchema = z.looseObject({});

export const projectDataSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().max(80).optional(),
  country: countrySchema,
  /** Exactly one room in planner v1; v2 allows several. */
  rooms: z.array(projectRoomSchema).length(1),
  master: masterSheetSchema.optional(),
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
