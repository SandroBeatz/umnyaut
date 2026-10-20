import "server-only";
import { type ProjectData, projectDataSchema } from "@umnyaut/calc";
import { type Db, deleteProject, getProject, insertProject, type Json, touchProject, updateProject } from "@umnyaut/db";
import { hashEditToken, newEditToken, newProjectId } from "./ids";

/** `projects.data` cap (tech spec §9), same as the check in 0002_projects.sql. */
export const PROJECT_DATA_MAX = 32 * 1024;
const ID_ATTEMPTS = 5;

export type ParsedProject = { ok: true; data: ProjectData } | { ok: false; error: "invalid" | "too_large" };

/** Only the current schema is written; older links migrate in the browser (calc/project). */
export function parseProjectData(raw: unknown): ParsedProject {
  const parsed = projectDataSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (Buffer.byteLength(JSON.stringify(parsed.data)) > PROJECT_DATA_MAX) return { ok: false, error: "too_large" };
  return { ok: true, data: parsed.data };
}

const write = (data: ProjectData) => ({
  data: data as unknown as Json,
  schemaVersion: data.schemaVersion,
  country: data.country,
});

export async function createProject(db: Db, data: ProjectData): Promise<{ id: string; editToken: string }> {
  const editToken = newEditToken();
  const editTokenHash = hashEditToken(editToken);
  for (let attempt = 0; attempt < ID_ATTEMPTS; attempt++) {
    const id = newProjectId();
    if (await insertProject(db, { id, editTokenHash, ...write(data) })) return { id, editToken };
  }
  throw new Error("createProject: no free id");
}

export async function readProject(db: Db, id: string) {
  return getProject(db, id);
}

export async function replaceProject(db: Db, id: string, editToken: string, data: ProjectData) {
  return updateProject(db, id, hashEditToken(editToken), write(data));
}

export async function removeProject(db: Db, id: string, editToken: string): Promise<boolean> {
  return deleteProject(db, id, hashEditToken(editToken));
}

export async function markProjectOpen(db: Db, id: string): Promise<boolean> {
  return touchProject(db, id);
}
