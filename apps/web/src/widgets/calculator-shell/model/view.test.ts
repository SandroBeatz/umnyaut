import { toolModules } from "@umnyaut/calc";
import { getTool } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { describeResult, resultText } from "./view";

const NBSP = " ";

describe("describeResult", () => {
  it("wall area: main figure from the first summary entry, the rest as tiles, steps with numbers", () => {
    const tool = getTool("osnova", "ploshchad-sten");
    if (!tool) throw new Error("no tool");
    const module = toolModules["ploshchad-sten"];
    const result = module.compute(module.defaults({ country: "RU" }), { country: "RU" });
    const view = describeResult(tool, result, "RU");
    expect(view.mode).toBe("measure");
    expect(view.main).toMatchObject({ title: "Стены без окон и дверей", value: "44,78", unit: "м²" });
    expect(view.tiles.map((t) => t.key)).toEqual(["grossWallArea", "openingsArea", "ceilingArea", "perimeter"]);
    expect(view.steps[0]).toBe(`Периметр = 2 × (4,6 + 4,3) = 17,8 м`);
    expect(view.short).toBe(`44,78${NBSP}м²`);
    expect(view.warnings).toEqual([]);
    expect(resultText(tool, view)).toContain(`Стены без окон и дверей: 44,78${NBSP}м²`);
  });

  it("fills warning numbers", () => {
    const tool = getTool("osnova", "ploshchad-sten");
    if (!tool) throw new Error("no tool");
    const module = toolModules["ploshchad-sten"];
    const input = { ...module.defaults({ country: "RU" }), heightMm: 1900 };
    const view = describeResult(tool, module.compute(input, { country: "RU" }), "RU");
    expect(view.warnings[0]?.text).toBe("Проём 2 м выше стены 1,9 м. Проверьте высоту проёма или потолка");
  });

  it("purchase tools: packs with the right plural, related list, total and missing prices", () => {
    const tool = {
      id: "x",
      category: "pol",
      title: "Ламинат",
      status: "draft",
      fields: [],
      items: { laminate: { title: "Ламинат" } },
    } as never;
    const pack = { kind: "pack", size: { value: 2.22, unit: "m2" } } as const;
    const view = describeResult(
      tool,
      {
        items: [
          {
            key: "laminate",
            role: "main",
            need: { value: 21.3, unit: "m2" },
            pack,
            packs: 10,
            bought: { value: 22.2, unit: "m2" },
            leftover: { value: 0.9, unit: "m2" },
          },
          {
            key: "underlay",
            role: "related",
            need: { value: 20, unit: "m2" },
            pack: { kind: "roll", size: { value: 10, unit: "m2" } },
            packs: 2,
            bought: { value: 20, unit: "m2" },
            leftover: { value: 0, unit: "m2" },
          },
        ],
        summary: [],
        cost: { total: 12460, perM2: 630, missing: ["underlay"] },
        warnings: [],
        steps: [],
      },
      "RU",
    );
    expect(view.main).toMatchObject({ value: "10", unit: "пачек", caption: `21,3${NBSP}м² · останется 0,9${NBSP}м²` });
    expect(view.related[0]).toMatchObject({ title: "underlay", quantity: `2${NBSP}рулона` });
    expect(view.total?.missing).toBe("без 1 позиции");
    expect(view.short).toMatch(/^10\u00a0пачек · 12/);
  });
});
