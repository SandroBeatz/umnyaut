import "server-only";
import {
  createProject,
  EDIT_TOKEN,
  getDb,
  markProjectOpen,
  PROJECT_ID,
  parseProjectData,
  readProject,
  removeProject,
  replaceProject,
} from "@server/db";
import { ApiError, handle, ok, readJson } from "@server/http";
import { LIMITS } from "@server/limits";
import { runAfter } from "@server/platform";
import { z } from "zod";

/** The owner's token travels in a header, never in the URL (links get shared, logs keep URLs). */
export const EDIT_TOKEN_HEADER = "x-edit-token";

const bodySchema = z.object({ data: z.unknown() });

function requireDb() {
  const db = getDb();
  if (!db) throw new ApiError("db_unavailable", "No database in this environment");
  return db;
}

function requireId(id: string): string {
  if (!PROJECT_ID.test(id)) throw new ApiError("not_found", "No such project");
  return id;
}

/** A wrong token answers like a missing project: nobody learns that an id exists. */
function requireToken(request: Request): string {
  const token = request.headers.get(EDIT_TOKEN_HEADER) ?? "";
  if (!EDIT_TOKEN.test(token)) throw new ApiError("not_found", "No such project");
  return token;
}

async function readData(request: Request) {
  const { data } = await readJson(request, bodySchema);
  const parsed = parseProjectData(data);
  if (!parsed.ok) {
    throw parsed.error === "too_large"
      ? new ApiError("too_large", "Project data over 32 KB")
      : new ApiError("invalid_body", "Project data does not match schema 2");
  }
  return parsed.data;
}

/** `POST /api/projects/` — a new estimate snapshot → `{ id, editToken }`. */
export function postProject(request: Request): Promise<Response> {
  return handle(request, { route: "/api/projects", limit: LIMITS.projectCreate }, async () => {
    const db = requireDb();
    const data = await readData(request);
    return ok(await createProject(db, data), 201);
  });
}

/** `GET /api/projects/[id]/` — the snapshot as stored; the browser migrates it. Counts the open after the answer. */
export function getProject(request: Request, rawId: string): Promise<Response> {
  return handle(request, { route: "/api/projects/[id]", limit: LIMITS.projectRead }, async () => {
    const db = requireDb();
    const id = requireId(rawId);
    const project = await readProject(db, id);
    if (!project) throw new ApiError("not_found", "No such project");
    runAfter(() => markProjectOpen(db, id));
    return ok({ id: project.id, data: project.data, updatedAt: project.updatedAt });
  });
}

/** `PUT /api/projects/[id]/` — the owner refreshes the same link with the current estimate. */
export function putProject(request: Request, rawId: string): Promise<Response> {
  return handle(request, { route: "/api/projects/[id]", limit: LIMITS.projectUpdate }, async () => {
    const db = requireDb();
    const id = requireId(rawId);
    const token = requireToken(request);
    const data = await readData(request);
    const updated = await replaceProject(db, id, token, data);
    if (!updated) throw new ApiError("not_found", "No such project");
    return ok({ id, updatedAt: updated.updatedAt });
  });
}

/** `DELETE /api/projects/[id]/` — the owner removes the link (tech spec §16, data deletion). */
export function deleteProject(request: Request, rawId: string): Promise<Response> {
  return handle(request, { route: "/api/projects/[id]", limit: LIMITS.projectDelete }, async () => {
    const db = requireDb();
    const id = requireId(rawId);
    const token = requireToken(request);
    if (!(await removeProject(db, id, token))) throw new ApiError("not_found", "No such project");
    return ok({ id });
  });
}
