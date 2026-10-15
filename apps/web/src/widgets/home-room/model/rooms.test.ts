import type { Estimate } from "@umnyaut/calc";
import { describe, expect, it } from "vitest";
import { freshType, hasCounted, roomCount, roomLines, suggestedTools } from "./rooms";

const estimate: Estimate = {
  schemaVersion: 2,
  id: "e1",
  name: "Ремонт квартиры",
  country: "RU",
  rooms: [
    { id: "r1", name: "Зал", type: "living", shape: "rect", lengthMm: 4600, widthMm: 4300, heightMm: 2700 },
    { id: "r2", name: "Ванная", type: "bathroom", lengthMm: 2200, widthMm: 1900 },
    { id: "r3", name: "Комната 3", type: "other" },
  ],
  calcs: [
    { id: "c1", roomId: "r1", tool: "laminat", toolVersion: 1, input: {}, openedAt: 10, addedAt: 10 },
    { id: "c2", roomId: "r1", tool: "oboi", toolVersion: 1, input: {}, openedAt: 30, addedAt: 30 },
    { id: "c3", roomId: "r1", tool: "kraska", toolVersion: 1, input: {}, openedAt: 50 },
    { id: "c4", roomId: "r2", tool: "plitka", toolVersion: 1, input: {}, openedAt: 20, addedAt: 20 },
  ],
  prices: {},
  totals: { sum: 52_000, byRoom: { r1: 40_000, r2: 12_000 }, saved: 0, missing: 0, at: 60 },
  activeRoomId: "r2",
  updatedAt: 60,
};

describe("«Ваш ремонт»", () => {
  it("appears once a calc is in the list, not for drafts", () => {
    expect(hasCounted(null)).toBe(false);
    expect(hasCounted({ ...estimate, calcs: estimate.calcs.filter((c) => c.addedAt === undefined) })).toBe(false);
    expect(hasCounted(estimate)).toBe(true);
  });

  it("lists the active room first, with area, counted calcs and its saved sum", () => {
    const lines = roomLines(estimate);
    expect(lines.map((l) => l.id)).toEqual(["r2", "r1", "r3"]);
    const hall = lines.find((l) => l.id === "r1");
    expect(hall?.meta).toBe("19,8 м² · 2 расчёта");
    expect(hall?.sum).toBe(40_000);
  });

  it("a row opens the room's last opened counted calc", () => {
    const hall = roomLines(estimate).find((l) => l.id === "r1");
    expect(hall).toMatchObject({ calcId: "c2", href: "/steny/oboi/" });
  });

  it("an empty room leads to its type's first usual calculator", () => {
    const empty = roomLines(estimate).find((l) => l.id === "r3");
    expect(empty?.meta).toBe("пока ничего не посчитано");
    expect(empty?.calcId).toBeUndefined();
    expect(empty?.href).toBe(`/pol/${suggestedTools("other")[0]?.id}/`);
  });

  it("counts rooms in Russian", () => {
    expect(roomCount(1)).toBe("1 комната");
    expect(roomCount(2)).toBe("2 комнаты");
    expect(roomCount(5)).toBe("5 комнат");
  });
});

describe("a new room's type", () => {
  it("is the first type the flat has no room of", () => {
    expect(freshType([])).toBe("living");
    expect(freshType([{ type: "living" }, { type: "bathroom" }])).toBe("bedroom");
    const all = (["living", "bedroom", "kitchen", "bathroom", "hall"] as const).map((type) => ({ type }));
    expect(freshType(all)).toBe("living");
  });
});
