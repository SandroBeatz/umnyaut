import { describe, expect, it } from "vitest";
import { toolModules } from "./index";

describe("toolModules", () => {
  for (const [id, tool] of Object.entries(toolModules)) {
    it(`${id}: id matches key and defaults compute without throwing`, () => {
      expect(tool.id).toBe(id);
      const ctx = { country: "RU" } as const;
      const input = tool.input.parse(tool.defaults(ctx));
      const result = tool.compute(input, ctx);
      expect(Array.isArray(result.items)).toBe(true);
    });
  }
});
