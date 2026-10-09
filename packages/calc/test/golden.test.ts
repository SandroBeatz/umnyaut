import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type GoldenFile, validateGolden } from "../src/golden";
import { toolModules } from "../src/tools";
import type { ToolModule } from "../src/types";

const toolsDir = join(import.meta.dirname, "../src/tools");
const dirs = readdirSync(toolsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

describe("golden examples", () => {
  it("every tool folder is a registered module", () => {
    expect(dirs.filter((d) => !(d in toolModules))).toEqual([]);
  });

  for (const [id, tool] of Object.entries(toolModules) as [string, ToolModule<unknown>][]) {
    const path = join(toolsDir, id, "golden.ts");
    if (tool.version === 0) {
      it.skip(`${id}: placeholder (version 0), golden examples come with the formula`);
      continue;
    }
    it(`${id}: ≥ 10 sourced examples, all match, benchmark differences explained`, async () => {
      expect(existsSync(path), `${id}/golden.ts is missing`).toBe(true);
      const { golden } = (await import(path)) as { golden: GoldenFile<unknown> };
      expect(validateGolden(tool, golden)).toEqual([]);
    });
  }
});
