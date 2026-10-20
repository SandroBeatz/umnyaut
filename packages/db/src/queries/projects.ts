import type { Db } from "../client";
import type { Json } from "../types";
import { fail } from "./error";

const UNIQUE_VIOLATION = "23505";

export interface ProjectRow {
  id: string;
  data: Json;
  schemaVersion: number;
  country: string;
  updatedAt: string;
}

export interface ProjectWrite {
  data: Json;
  schemaVersion: number;
  country: string;
}

/** Inserts a project; `false` when the id is taken (the caller retries with a new one). */
export async function insertProject(
  db: Db,
  project: ProjectWrite & { id: string; editTokenHash: string },
): Promise<boolean> {
  const { error } = await db.from("projects").insert({
    id: project.id,
    data: project.data,
    schema_version: project.schemaVersion,
    country: project.country,
    edit_token_hash: project.editTokenHash,
  });
  if (!error) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  fail("insertProject", error);
}

export async function getProject(db: Db, id: string): Promise<ProjectRow | null> {
  const { data, error } = await db
    .from("projects")
    .select("id, data, schema_version, country, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("getProject", error);
  if (!data) return null;
  return {
    id: data.id,
    data: data.data,
    schemaVersion: data.schema_version,
    country: data.country,
    updatedAt: data.updated_at,
  };
}

/** Replaces the data when the token hash matches; `null` when there is no such project or the token is wrong. */
export async function updateProject(
  db: Db,
  id: string,
  editTokenHash: string,
  project: ProjectWrite,
): Promise<{ updatedAt: string } | null> {
  const { data, error } = await db
    .from("projects")
    .update({
      data: project.data,
      schema_version: project.schemaVersion,
      country: project.country,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("edit_token_hash", editTokenHash)
    .select("updated_at")
    .maybeSingle();
  if (error) fail("updateProject", error);
  return data ? { updatedAt: data.updated_at } : null;
}

/** Deletes when the token hash matches; `false` when there is no such project or the token is wrong. */
export async function deleteProject(db: Db, id: string, editTokenHash: string): Promise<boolean> {
  const { data, error } = await db
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("edit_token_hash", editTokenHash)
    .select("id")
    .maybeSingle();
  if (error) fail("deleteProject", error);
  return data !== null;
}

/** Marks an open for the return metric (a return counts after an hour); `false` when the project is gone. */
export async function touchProject(db: Db, id: string): Promise<boolean> {
  const { data, error } = await db.rpc("project_touch", { p_id: id });
  if (error) fail("touchProject", error);
  return data;
}
