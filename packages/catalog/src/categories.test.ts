import { describe, expect, it } from "vitest";
import { activeCategories, tools } from "./registry";

describe("categories", () => {
  it("every active category has a note and a work order of live tools", () => {
    for (const category of activeCategories()) {
      expect(category.note, category.slug).toBeTruthy();
      expect(category.steps?.length ?? 0, `${category.slug} steps`).toBeGreaterThanOrEqual(2);
      for (const step of category.steps ?? [])
        for (const id of step.tools)
          expect(tools.find((t) => t.id === id)?.status, `${category.slug} → ${id}`).toBe("live");
    }
  });
});
