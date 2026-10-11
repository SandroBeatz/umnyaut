import { describe, expect, it } from "vitest";
import { countries } from "./countries";
import { normTitles } from "./norm-titles";
import { getNorm, norms } from "./norms";
import { tools } from "./registry";
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

  it("every norm has a Russian title for «Методика», and every title a norm", () => {
    expect(Object.keys(normTitles).sort()).toEqual(Object.keys(norms).sort());
  });

  it("typical prices name a price field's item, are positive and carry a check date", () => {
    const items = new Set(tools.flatMap((t) => t.fields.flatMap((f) => (f.kind === "price" ? [f.item] : []))));
    for (const country of countries) {
      const entries = Object.entries(country.typicalPrices);
      for (const [item, price] of entries) {
        expect(items.has(item), `${country.code}.${item}`).toBe(true);
        expect(price, `${country.code}.${item}`).toBeGreaterThan(0);
      }
      if (entries.length > 0) expect(country.pricesCheckedAt, country.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
