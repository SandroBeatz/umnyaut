/** SQL migrations, generated DB types and query helpers. Used only from apps/web/server. */
export { createDb, type Db } from "./client";
export { DbError } from "./queries/error";
export { addEvent, type EventCount } from "./queries/events";
export { hitLimit } from "./queries/limits";
export {
  deleteProject,
  getProject,
  insertProject,
  type ProjectRow,
  type ProjectWrite,
  touchProject,
  updateProject,
} from "./queries/projects";
export { type ErrorReport, insertReport } from "./queries/reports";
export type { Database, Json } from "./types";
