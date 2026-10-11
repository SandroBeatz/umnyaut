import { type FieldDef, getTool } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { changedHidden, formSections, shapeAsDropdown } from "./fields";

const fieldsOf = (category: string, id: string) => {
  const tool = getTool(category, id);
  if (!tool) throw new Error(`no tool ${id}`);
  return tool.fields;
};
const names = (fields: readonly FieldDef[]) => fields.map((f) => ("name" in f ? f.name : `preset:${f.label}`));

describe("formSections", () => {
  it("puts the room shape right after the room width, before laying and presets", () => {
    const { main, more } = formSections(fieldsOf("pol", "laminat"), { shape: "rect", method: "straight" });
    expect(names(main)).toEqual(["lengthMm", "widthMm", "shape", "method", "preset:Доска"]);
    expect(names(more)).not.toContain("shape");
  });

  it("an L-shaped room brings its cut-out fields along", () => {
    const { main, more } = formSections(fieldsOf("osnova", "ploshchad-komnaty"), { shape: "l" });
    expect(names(main).slice(0, 5)).toEqual(["lengthMm", "widthMm", "shape", "cutLengthMm", "cutWidthMm"]);
    expect(names(more)).not.toContain("cutLengthMm");
  });

  it("a changed shape is not counted behind «Ещё параметры»", () => {
    const fields = fieldsOf("osnova", "ploshchad-komnaty");
    expect(changedHidden(fields, { shape: "l", cutLengthMm: 2000 }, { shape: "rect", cutLengthMm: 0 })).toBe(0);
  });
});

describe("shapeAsDropdown", () => {
  it("shares the row with a half-width select (laminate laying, linoleum roll), else a full-width segment", () => {
    const sections = (category: string, id: string) => formSections(fieldsOf(category, id), { shape: "rect" }).main;
    expect(shapeAsDropdown(sections("pol", "laminat"))).toBe(true);
    expect(shapeAsDropdown(sections("pol", "linoleum"))).toBe(true);
    expect(shapeAsDropdown(sections("osnova", "ploshchad-komnaty"))).toBe(false);
    expect(shapeAsDropdown(sections("pol", "plintus"))).toBe(false);
  });
});
