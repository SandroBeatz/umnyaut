import { home } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { exampleCards, initialExample } from "./cards";
import { DEFAULT_TYPE, exampleRoom, isInitialExample, openingsText, surfacesOf, worksOf } from "./example";

const all = home.works.map((w) => w.id);

describe("home example", () => {
  it("fills the missing parts of the room from the 4 × 3 m example", () => {
    expect(exampleRoom(null)).toEqual(home.exampleRoom);
    expect(exampleRoom({ lengthMm: 5000 })).toMatchObject({ lengthMm: 5000, widthMm: 3000, heightMm: 2700 });
  });

  it("gives one card per example item of the selected works, in purchase units", () => {
    const cards = exampleCards(exampleRoom(null), all, "RU");
    expect(cards.map((c) => c.key)).toEqual(home.works.flatMap((w) => w.items.map((i) => `${i.tool}:${i.item}`)));
    for (const card of cards) expect(card.quantity).toMatch(/^\d/);
    expect(cards.find((c) => c.key === "kraska:paint")?.title).toBe("Краска, потолок");
  });

  it("follows the room: a larger floor needs more laminate", () => {
    const packs = (lengthMm: number) =>
      Number.parseInt(
        exampleCards({ ...exampleRoom(null), lengthMm }, ["floor"], "RU").find((c) => c.key === "laminat:laminate")
          ?.quantity ?? "0",
        10,
      );
    expect(packs(8000)).toBeGreaterThan(packs(4000));
  });

  it("follows the room type: a bathroom gets tile, not laminate", () => {
    const keys = exampleCards(exampleRoom(null), worksOf("bathroom"), "RU").map((c) => c.key);
    expect(keys).toContain("plitka:tile");
    expect(keys).not.toContain("laminat:laminate");
  });

  it("shows nothing when no work is selected", () => {
    expect(exampleCards(exampleRoom(null), [], "RU")).toEqual([]);
  });
});

describe("home example first state", () => {
  it("the server's cards are what the browser would compute", () => {
    const room = exampleRoom(null);
    expect(isInitialExample(room, DEFAULT_TYPE, "RU")).toBe(true);
    expect(initialExample()).toEqual(exampleCards(room, worksOf(DEFAULT_TYPE), "RU"));
  });

  it("any change leaves the first state", () => {
    const room = exampleRoom(null);
    expect(isInitialExample({ ...room, lengthMm: 5000 }, DEFAULT_TYPE, "RU")).toBe(false);
    expect(isInitialExample(room, "bathroom", "RU")).toBe(false);
    expect(isInitialExample(room, DEFAULT_TYPE, "KZ")).toBe(false);
  });

  it("a type with the same works keeps the first state", () => {
    expect(isInitialExample(exampleRoom(null), "bedroom", "RU")).toBe(true);
  });
});

describe("doors and windows", () => {
  it("counts them in Russian, doors first; none — empty", () => {
    expect(openingsText(exampleRoom(null))).toBe("1\u00a0дверь");
    const room = {
      ...exampleRoom(null),
      openings: [
        { type: "window", widthMm: 1200, heightMm: 1400, count: 2 },
        { type: "door", widthMm: 800, heightMm: 2000, count: 1 },
        { type: "window", widthMm: 600, heightMm: 600, count: 3 },
      ],
    } as const;
    expect(openingsText(room)).toBe("1\u00a0дверь, 5\u00a0окон");
    expect(openingsText({ ...room, openings: [] })).toBe("");
  });
});

describe("room surfaces", () => {
  it("4,6 × 4,3 × 2,7 м without openings: 19,78 m² floor and ceiling, 48,06 m² walls", () => {
    const s = surfacesOf({ lengthMm: 4600, widthMm: 4300, heightMm: 2700, openings: [] });
    expect(s.floorM2).toBeCloseTo(19.78, 2);
    expect(s.ceilingM2).toBe(s.floorM2);
    expect(s.wallsM2).toBeCloseTo(48.06, 2);
  });

  it("the example room's door comes off the walls: 37,8 − 1,6 = 36,2 m²", () => {
    const s = surfacesOf(exampleRoom(null));
    expect(s.wallsM2).toBeCloseTo(36.2, 2);
  });
});
