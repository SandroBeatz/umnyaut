import { type PurchaseItem, toolModules } from "@umnyaut/calc";
import { getTool } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import type { ToolValues } from "@/entities/tool";
import { listStart, productName, productPatch, takeOffers } from "./shared";

const tool = (category: string, id: string) => {
  const found = getTool(category, id);
  if (!found) throw new Error(id);
  return found;
};
const tile = tool("plitka", "plitka");
const adhesive = tool("plitka", "klej");
const grout = tool("plitka", "zatirka");
const paint = tool("steny", "kraska");

/** A tool's items as its calculator counts them with `values` over defaults. */
const counted = (id: "plitka" | "klej" | "zatirka" | "kraska", values: ToolValues = {}) => {
  const module = toolModules[id];
  const all = { ...module.defaults({ country: "RU" }), ...values } as ToolValues;
  return { values: all, items: module.compute(all as never, { country: "RU" }).items as readonly PurchaseItem[] };
};
const item = (items: readonly PurchaseItem[], key: string) => {
  const found = items.find((i) => i.key === key);
  if (!found) throw new Error(key);
  return found;
};

describe("shared consumables taken from the list", () => {
  it("names the product with its pack", () => {
    const { items } = counted("klej", { adhesiveClass: "C2TE", bagKg: 25 });
    expect(productName(adhesive, item(items, "tile-adhesive")).replace(/\s/g, " ")).toBe(
      "Плиточный клей C2TE, мешок 25 кг",
    );
  });

  it("offers the list's adhesive class under the tile's adhesive block, and takes it", () => {
    const list = { "tile-adhesive": [item(counted("klej", { adhesiveClass: "C2TE" }).items, "tile-adhesive")] };
    const { values, items } = counted("plitka", { adhesive: true, adhesiveClass: "C1" });
    const offers = takeOffers(tile, values, items, list);
    expect(offers.adhesive?.text.replace(/\s/g, " ")).toBe(
      "В списке уже есть «Плиточный клей C2TE, мешок 25 кг» — взять его?",
    );
    expect(offers.adhesive?.patch).toEqual({ adhesiveClass: "C2TE" });
    const taken = counted("plitka", { adhesive: true, adhesiveClass: "C2TE" });
    expect(takeOffers(tile, taken.values, taken.items, list)).toEqual({});
  });

  it("offers nothing while the block is off or the calc already buys the list's product", () => {
    const list = { "tile-adhesive": [item(counted("klej", { adhesiveClass: "C2TE" }).items, "tile-adhesive")] };
    const off = counted("plitka", { adhesive: false, adhesiveClass: "C1" });
    expect(takeOffers(tile, off.values, off.items, list).adhesive).toBeUndefined();
    const same = counted("klej", { adhesiveClass: "C2TE" });
    expect(takeOffers(adhesive, same.values, same.items, list)).toEqual({});
  });

  it("a grout colour typed by hand goes back to «Свой цвет» with its name", () => {
    const own = item(counted("zatirka", { groutColor: "custom", groutColorName: "Жасмин" }).items, "grout");
    expect(productPatch(tile, own, undefined)).toEqual({ groutColor: "custom", groutColorName: "жасмин" });
  });

  it("takes the pack size where the form has it, and offers nothing for another pack where it has not", () => {
    const fiveKg = item(counted("zatirka", { groutColor: "white", packKg: 5 }).items, "grout");
    const { items } = counted("zatirka", { groutColor: "white", packKg: 2 });
    expect(productPatch(grout, fiveKg, item(items, "grout"))).toEqual({ groutColor: "white", packKg: 5 });
    const tileGrout = counted("plitka", { grout: true, groutColor: "grey" });
    expect(productPatch(tile, fiveKg, item(tileGrout.items, "grout"))).toBeUndefined();
  });

  it("a new calc starts with the list's products; nothing when it shows them already", () => {
    const list = {
      primer: [item(counted("kraska", { primer: true, primerPackL: 5 }).items, "primer")],
      grout: [item(counted("zatirka", { groutColor: "graphite" }).items, "grout")],
    };
    const fresh = counted("plitka", { primer: false, grout: true, groutColor: "white" });
    expect(listStart(tile, fresh.values, fresh.items, list)).toEqual({ primerPackL: 5, groutColor: "graphite" });
    const started = counted("plitka", { primer: false, grout: true, groutColor: "graphite", primerPackL: 5 });
    expect(listStart(tile, started.values, started.items, list)).toEqual({});
    const painted = counted("kraska", { primer: true, primerPackL: 10 });
    expect(listStart(paint, painted.values, painted.items, list)).toEqual({ primerPackL: 5 });
  });
});
