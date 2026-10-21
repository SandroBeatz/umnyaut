import {
  GROUT_DENSITY,
  LAMINATE_WASTE_PCT,
  LINOLEUM_DOORWAY_MM,
  LINOLEUM_TRIM_ALLOWANCE_MM,
  LINOLEUM_WALL_TRIM_MM,
  LINOLEUM_WIDTHS_MM,
  MIN_PLINTH_PIECE_MM,
  NOTCH_TABLE,
  TILE_DIAGONAL_RESERVE_PCT,
  toolModules,
  UNDERLAY_ROLL_WIDTH_MM,
} from "@umnyaut/calc";
import { describe, expect, it } from "vitest";
import { type CategoryDef, categories, reservedSegments } from "./categories";
import { roomSuggestions, workOrder } from "./estimate";
import { norms } from "./norms";
import { toolPath } from "./paths";
import { activeCategories, getTool, sharedItems, tools } from "./registry";
import { toolGuides } from "./scheme";
import type { ToolDef } from "./tools/types";
import { wallpaperKinds } from "./tools/variants";
import { type RegistryInput, validateRegistry } from "./validate";

const real: RegistryInput = { categories, reservedSegments, tools, modules: toolModules, norms };

describe("registry", () => {
  it("passes every registry rule", () => {
    expect(validateRegistry(real)).toEqual([]);
  });

  it("shared consumables are adhesive, grout, primer and wallpaper paste — one flag per item everywhere", () => {
    expect([...sharedItems].sort()).toEqual(["grout", "primer", "tile-adhesive", "wallpaper-glue"]);
    const [kraska] = tools.filter((t) => t.id === "kraska");
    const unflagged = { ...kraska, items: { ...kraska?.items, primer: { title: "Грунтовка" } } } as ToolDef;
    const others = tools.filter((t) => t.id !== "kraska");
    expect(validateRegistry({ ...real, tools: [...others, unflagged] })).toEqual([
      "item primer: shared in some tools only",
    ]);
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
      for (const { code } of result.layout?.guide ?? [])
        expect(toolGuides[tool.id]?.[code], `${tool.id} guide.${code}`).toBeDefined();
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
    expect(oboi.pasteCoverageM2).toBe(value("wallpaperPaste.coverage.nonwoven"));
    const kraska = toolModules.kraska.defaults({ country: "RU" });
    expect(kraska.coverageM2PerL).toBe(value("paint.coverage"));
    expect(kraska.coats).toBe(value("paint.coats"));
    expect(kraska.primerRateLPerM2).toBe(value("primer.consumption"));
    expect(toolModules.oboi.defaults({ country: "RU" }).primerRateLPerM2).toBe(value("primer.consumption"));
    expect(toolModules.plintus.defaults({ country: "RU" }).plankLengthMm / 1000).toBe(value("plinth.length"));
    expect(LINOLEUM_WALL_TRIM_MM).toBe(value("linoleum.wallTrim"));
    expect(toolModules.linoleum.defaults({ country: "RU" }).allowanceMm / 10).toBe(value("linoleum.trimAllowance"));
    expect(LINOLEUM_TRIM_ALLOWANCE_MM / 10).toBe(value("linoleum.trimAllowance"));
    expect(LINOLEUM_DOORWAY_MM / 10).toBe(value("linoleum.doorway"));
    expect(Math.min(...LINOLEUM_WIDTHS_MM) / 1000).toBe(value("linoleum.rollWidthMin"));
    expect(Math.max(...LINOLEUM_WIDTHS_MM) / 1000).toBe(value("linoleum.rollWidthMax"));
    expect(MIN_PLINTH_PIECE_MM / 10).toBe(value("plinth.minPiece"));
    expect(toolModules.plintus.defaults({ country: "RU" }).fastenerSpacingMm).toBe(value("plinth.fastenerSpacing"));
    expect(toolModules.klej.defaults({ country: "RU" }).backButterMm).toBe(value("tileAdhesive.backButter"));
    for (const row of NOTCH_TABLE)
      expect(row.kgPerM2, `notch ${row.notchMm}`).toBe(value(`tileAdhesive.notch${row.notchMm}`));
    expect(toolModules.klej.defaults({ country: "RU" }).bagKg).toBe(value("tileAdhesive.bag"));
    const zatirka = toolModules.zatirka.defaults({ country: "RU" });
    expect(GROUT_DENSITY).toBe(value("grout.density"));
    expect(zatirka.reservePct).toBe(value("grout.reserve"));
    expect(zatirka.jointMm).toBe(value("tile.joint.floor"));
    expect(zatirka.packKg).toBe(value("grout.pack"));
    expect(toolModules.linoleum.defaults({ country: "RU" }).overlapMm).toBe(value("linoleum.seamOverlap"));
    expect(toolModules.linoleum.defaults({ country: "RU" }).weldPerTubeM).toBe(value("linoleum.weldPerTube"));
    const laminat = toolModules.laminat.defaults({ country: "RU" });
    expect(laminat.gapMm).toBe(value("laminate.expansionGap"));
    expect(laminat.minOffsetMm).toBe(value("laminate.minOffset"));
    expect(laminat.underlayRollM2).toBe(value("underlay.rollArea"));
    expect(UNDERLAY_ROLL_WIDTH_MM / 1000).toBe(value("underlay.rollWidth"));
    expect(LAMINATE_WASTE_PCT.diagonal).toBe(value("laminate.waste.diagonal"));
    expect(LAMINATE_WASTE_PCT.herringbone).toBe(value("laminate.waste.herringbone"));
    const plitka = toolModules.plitka.defaults({ country: "RU" });
    expect(plitka.reservePct).toBe(value("tile.reserve"));
    expect(TILE_DIAGONAL_RESERVE_PCT).toBe(value("tile.reserve.diagonal"));
    expect(plitka.tilesPerBox).toBe(value("tile.perBox"));
    expect(plitka.jointMm).toBe(value("tile.joint.floor"));
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

describe("estimate page data", () => {
  it("orders every tool once", () => {
    expect([...workOrder].sort()).toEqual(tools.map((t) => t.id).sort());
  });

  it("suggests live tools with purchase items, three per room type", () => {
    for (const ids of Object.values(roomSuggestions)) {
      expect(ids).toHaveLength(3);
      for (const id of ids) expect(tools.find((t) => t.id === id && t.status === "live" && t.items)).toBeDefined();
    }
  });
});

describe("consumable variants (P17.4)", () => {
  it("a wallpaper type fills the paste coverage of its norm; the default is non-woven", () => {
    const norm = { nonwoven: "nonwoven", heavy: "heavy", paper: "paper" } as const;
    for (const kind of wallpaperKinds)
      expect(norms[`wallpaperPaste.coverage.${norm[kind.value]}`]?.value).toBe(kind.coverageM2);
    const defaults = toolModules.oboi.defaults({ country: "RU" }) as { wallpaperType: string; pasteCoverageM2: number };
    expect(defaults.wallpaperType).toBe("nonwoven");
    expect(defaults.pasteCoverageM2).toBe(wallpaperKinds[0].coverageM2);
  });

  it("every select option the module accepts, and nothing more", () => {
    for (const tool of tools) {
      const defaults = toolModules[tool.id as keyof typeof toolModules].defaults({ country: "RU" }) as Record<
        string,
        unknown
      >;
      const module = toolModules[tool.id as keyof typeof toolModules];
      for (const field of tool.fields) {
        if (field.kind !== "select" || !["adhesiveClass", "groutColor", "wallpaperType"].includes(field.name)) continue;
        for (const option of field.options)
          expect(module.input.safeParse({ ...defaults, [field.name]: option.value }).success).toBe(true);
      }
    }
  });
});
