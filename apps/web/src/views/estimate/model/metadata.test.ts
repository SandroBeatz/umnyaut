import { describe, expect, it } from "vitest";
import { sharedProjectMetadata } from "./metadata";

describe("sharedProjectMetadata", () => {
  const data = {
    schemaVersion: 2,
    id: "e1",
    name: "Квартира Ивановых",
    country: "RU",
    rooms: [
      { id: "r1", name: "", type: "living" },
      { id: "r2", name: "", type: "kitchen" },
    ],
    calcs: [{ id: "c1", roomId: "r1", tool: "laminat", toolVersion: 3, input: {}, openedAt: 0, addedAt: 1 }],
    prices: {},
    updatedAt: 1,
  };

  it("titles the preview by size, never by the estimate's name, and keeps it out of the index", () => {
    const meta = sharedProjectMetadata("abcd2345", data);
    // `fill` puts a non-breaking space between a number and its word.
    expect(String(meta.title).replace(/\u00a0/g, " ")).toBe("Список покупок: 2 комнаты · 1 расчёт");
    expect(JSON.stringify(meta)).not.toContain("Ивановых");
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates?.canonical).toBe("/p/abcd2345/");
  });

  it("falls back to the generic title for data it cannot read", () => {
    expect(sharedProjectMetadata("abcd2345", { schemaVersion: 9 }).title).toBe("Список покупок по ссылке");
  });
});
