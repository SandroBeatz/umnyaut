import type { Db } from "../client";
import type { Json } from "../types";
import { fail } from "./error";

export interface ErrorReport {
  tool?: string;
  toolVersion?: number;
  input?: Json;
  message: string;
  pageUrl?: string;
}

export async function insertReport(db: Db, report: ErrorReport): Promise<void> {
  const { error } = await db.from("error_reports").insert({
    tool: report.tool ?? null,
    tool_version: report.toolVersion ?? null,
    input: report.input ?? null,
    message: report.message,
    page_url: report.pageUrl ?? null,
  });
  if (error) fail("insertReport", error);
}
