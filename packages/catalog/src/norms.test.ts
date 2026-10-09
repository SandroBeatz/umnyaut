import { describe, expect, it } from "vitest";
import { countries } from "./countries";
import { getNorm } from "./norms";
import { packNouns } from "./units";

describe("norms, countries, units", () => {
  it("looks a norm up by dotted id", () => {
    const from = { "underlay.overlap": { value: 200, unit: "мм", source: "test", checkedAt: "2026-10-09" } };
    expect(getNorm("underlay.overlap", from)?.value).toBe(200);
    expect(getNorm("missing")).toBeUndefined();
  });

  it("covers all four markets once", () => {
    expect(countries.map((c) => c.code)).toEqual(["RU", "KZ", "BY", "KG"]);
  });

  it("every pack kind has three plural forms", () => {
    for (const forms of Object.values(packNouns)) expect(forms).toHaveLength(3);
  });
});
