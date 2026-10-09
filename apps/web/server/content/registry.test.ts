import "server-only";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tools } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { loadToolContent, TOOL_CONTENT_DIR } from "./load";

/** Plan P4.7, the part only apps/web can see: module ↔ catalog ↔ content ↔ golden. */
const calcTools = join(process.cwd(), "../../packages/calc/src/tools");

describe("registry ↔ content ↔ golden", () => {
  it("every content file belongs to a catalog tool", () => {
    const files = existsSync(TOOL_CONTENT_DIR) ? readdirSync(TOOL_CONTENT_DIR).filter((f) => f.endsWith(".md")) : [];
    const ids = tools.map((t) => `${t.id}.md`);
    expect(files.filter((f) => !ids.includes(f))).toEqual([]);
  });

  it("every content file passes the schema and its norms exist", () => {
    for (const tool of tools) expect(() => loadToolContent(tool.id)).not.toThrow();
  });

  it("a live tool has content and golden examples", () => {
    for (const tool of tools.filter((t) => t.status === "live")) {
      expect(loadToolContent(tool.id), `content/tools/${tool.id}.md`).toBeDefined();
      expect(existsSync(join(calcTools, tool.id, "golden.ts")), `${tool.id}/golden.ts`).toBe(true);
    }
  });
});
