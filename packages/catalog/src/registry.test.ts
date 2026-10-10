import { GROUT_DENSITY, NOTCH_TABLE, toolModules } from "@umnyaut/calc";
import { describe, expect, it } from "vitest";
import { type CategoryDef, categories, reservedSegments } from "./categories";
import { norms } from "./norms";
import { activeCategories, getTool, toolPath, tools } from "./registry";
import type { ToolDef } from "./tools/types";
import { type RegistryInput, validateRegistry } from "./validate";

const real: RegistryInput = { categories, reservedSegments, tools, modules: toolModules, norms };

describe("registry", () => {
  it("passes every registry rule", () => {
    expect(validateRegistry(real)).toEqual([]);
  });

  it("tool URLs are unique", () => {
    const paths = tools.map(toolPath);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("looks tools up by category and id only", () => {
    const [first] = tools;
    if (!first) throw new Error("registry is empty");
    expect(getTool(first.category, first.id)).toBe(first);
    const other = categories.find((c) => c.slug !== first.category);
    expect(getTool(other?.slug ?? "", first.id)).toBeUndefined();
  });

  it("every summary key and step code of a live tool has Russian text; presets pass the schema", () => {
    for (const tool of tools.filter((t) => t.status === "live")) {
      const module = toolModules[tool.id];
      const ctx = { country: "RU" } as const;
      const result = module.compute(module.input.parse(module.defaults(ctx)) as never, ctx);
      if (result.items.length === 0) {
        for (const { key } of result.summary) expect(tool.summary?.[key], `${tool.id} summary.${key}`).toBeDefined();
      }
      for (const { code } of result.steps) expect(tool.steps?.[code], `${tool.id} steps.${code}`).toBeDefined();
      for (const preset of tool.presets ?? []) {
        const input = { ...module.defaults(ctx), ...preset.values };
        expect(module.input.safeParse(input).success, `${tool.id} preset ${preset.id}`).toBe(true);
      }
    }
  });

  it("calc defaults use the catalog norms (calc cannot import them)", () => {
    const value = (id: string) => norms[id]?.value;
    const oboi = toolModules.oboi.defaults({ country: "RU" });
    expect(oboi.rollWidthMm / 1000).toBe(value("wallpaper.rollWidth"));
    expect(oboi.rollLengthMm / 1000).toBe(value("wallpaper.rollLength"));
    expect(oboi.trimMm / 10).toBe(value("wallpaper.trimAllowance"));
    expect(oboi.pasteCoverageM2).toBe(value("wallpaperPaste.coverage"));
    const kraska = toolModules.kraska.defaults({ country: "RU" });
    expect(kraska.coverageM2PerL).toBe(value("paint.coverage"));
    expect(kraska.coats).toBe(value("paint.coats"));
    expect(kraska.primerRateLPerM2).toBe(value("primer.consumption"));
    expect(toolModules.oboi.defaults({ country: "RU" }).primerRateLPerM2).toBe(value("primer.consumption"));
    expect(toolModules.plintus.defaults({ country: "RU" }).plankLengthMm / 1000).toBe(value("plinth.length"));
    for (const row of NOTCH_TABLE)
      expect(row.kgPerM2, `notch ${row.notchMm}`).toBe(value(`tileAdhesive.notch${row.notchMm}`));
    expect(toolModules.klej.defaults({ country: "RU" }).bagKg).toBe(value("tileAdhesive.bag"));
    const zatirka = toolModules.zatirka.defaults({ country: "RU" });
    expect(GROUT_DENSITY).toBe(value("grout.density"));
    expect(zatirka.reservePct).toBe(value("grout.reserve"));
    expect(zatirka.jointMm).toBe(value("tile.joint.floor"));
    expect(zatirka.packKg).toBe(value("grout.pack"));
  });

  it("active categories are exactly those with tools", () => {
    expect(activeCategories().map((c) => c.slug)).toEqual(
      categories.filter((c) => tools.some((t) => t.category === c.slug)).map((c) => c.slug),
    );
  });
});

describe("validateRegistry", () => {
  /** Loose on purpose: broken ids and categories that the real types would reject. */
  const tool = (over: Record<string, unknown>) =>
    ({ category: "osnova", title: "T", status: "draft", fields: [], ...over }) as unknown as ToolDef;
  const field = (name: string, main = true) => ({ kind: "toggle" as const, name, label: name, main });

  it("catches every broken rule", () => {
    const badCategories: CategoryDef[] = [
      { slug: "osnova", title: "A" },
      { slug: "osnova", title: "B" },
      { slug: "Bad_Slug", title: "C" },
      { slug: "api", title: "D" },
    ];
    const errors = validateRegistry({
      categories: badCategories,
      reservedSegments,
      norms: { "x.y": { value: Number.NaN, unit: "%", source: " ", checkedAt: "09.10.2026" } },
      modules: { a: { id: "a", version: 0 }, orphan: { id: "orphan", version: 1 } },
      tools: [
        tool({
          id: "a",
          status: "live",
          category: "nope",
          nextSteps: ["a", "ghost"],
          fields: [
            field("f1"),
            field("f2"),
            field("f3"),
            field("f4"),
            field("f1"),
            { kind: "preset", label: "P", presets: ["p1", "missing"] },
            { kind: "toggle", name: "w", label: "W", when: { ghost: "x" } },
          ],
          presets: [
            { id: "p1", label: "P1", values: { f1: true, zz: 1 } },
            { id: "p1", label: "P1 again", values: {} },
          ],
          norms: ["no.such"],
        }),
        tool({ id: "a" }),
        tool({ id: "No_Module" }),
      ],
    });
    expect(errors).toEqual([
      "category osnova: duplicate slug",
      "category Bad_Slug: malformed slug",
      "category api: reserved URL segment",
      "tool a: duplicate id (URL)",
      "module orphan: missing from the catalog",
      "tool a: unknown category nope",
      "tool a: live without a formula (version 0)",
      "tool a: next step points to itself",
      "tool a: next step ghost does not exist",
      "tool a: 5 main fields, at most 4",
      "tool a: duplicate field f1",
      "tool a: field w depends on unknown field ghost",
      "tool a: duplicate preset p1",
      "tool a: unknown preset missing",
      "tool a: preset p1 sets unknown field zz",
      "tool a: unknown norm no.such",
      "tool No_Module: malformed id",
      "tool No_Module: no calc module",
      "norm x.y: missing source",
      "norm x.y: checkedAt must be YYYY-MM-DD",
      "norm x.y: value is not a number",
    ]);
  });
});
