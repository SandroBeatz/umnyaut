import { toolModules } from "@umnyaut/calc";
import { describe, expect, it } from "vitest";
import { categories, reservedSegments } from "./categories";
import { activeCategories, getTool, toolPath, tools } from "./registry";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("registry", () => {
  it("category slugs are unique, well-formed and not reserved", () => {
    const slugs = categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(SLUG);
      expect(reservedSegments).not.toContain(slug);
    }
  });

  it("tool ids and URLs are unique and well-formed", () => {
    const ids = tools.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tool of tools) expect(tool.id).toMatch(SLUG);
    const paths = tools.map(toolPath);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("every catalog tool has a calc module and every module is in the catalog", () => {
    expect(tools.map((t) => t.id).sort()).toEqual(Object.keys(toolModules).sort());
  });

  it("looks tools up by category and id only", () => {
    const [first] = tools;
    if (!first) throw new Error("registry is empty");
    expect(getTool(first.category, first.id)).toBe(first);
    const other = categories.find((c) => c.slug !== first.category);
    expect(getTool(other?.slug ?? "", first.id)).toBeUndefined();
  });

  it("active categories are exactly those with tools", () => {
    expect(activeCategories().map((c) => c.slug)).toEqual(
      categories.filter((c) => tools.some((t) => t.category === c.slug)).map((c) => c.slug),
    );
  });
});
