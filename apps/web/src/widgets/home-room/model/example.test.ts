import { home } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { exampleCards, initialExample } from "./cards";
import { defaultWorks, exampleRoom, isInitialExample } from "./example";

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

  it("shows nothing when no work is selected", () => {
    expect(exampleCards(exampleRoom(null), [], "RU")).toEqual([]);
  });
});

describe("home example first state", () => {
  it("the server's cards are what the browser would compute", () => {
    const room = exampleRoom(null);
    expect(isInitialExample(room, defaultWorks(), "RU")).toBe(true);
    expect(initialExample()).toEqual(exampleCards(room, defaultWorks(), "RU"));
  });

  it("any change leaves the first state", () => {
    const room = exampleRoom(null);
    expect(isInitialExample({ ...room, lengthMm: 5000 }, defaultWorks(), "RU")).toBe(false);
    expect(isInitialExample(room, ["floor"], "RU")).toBe(false);
    expect(isInitialExample(room, defaultWorks(), "KZ")).toBe(false);
  });
});
