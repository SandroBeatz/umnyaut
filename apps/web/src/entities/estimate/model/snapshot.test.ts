import { ESTIMATE_LIMITS, type Estimate, migrateProject } from "@umnyaut/calc";
import { describe, expect, it } from "vitest";
import { mergeEstimate, replaceEstimate } from "./share";
import { decodeSnapshot, encodeSnapshot, SNAPSHOT_MAX } from "./snapshot";

const estimate = (id: string, rooms: number, calcsPerRoom = 1): Estimate => ({
  schemaVersion: 2,
  id,
  name: "Ремонт квартиры",
  country: "RU",
  rooms: Array.from({ length: rooms }, (_, i) => ({
    id: `r${i + 1}`,
    name: `Комната ${i + 1}`,
    type: "other" as const,
    lengthMm: 4000 + i,
    widthMm: 3000,
    heightMm: 2700,
    openings: [{ type: "door" as const, widthMm: 800, heightMm: 2000, count: 1 }],
  })),
  calcs: Array.from({ length: rooms * calcsPerRoom }, (_, i) => ({
    id: `c${i + 1}`,
    roomId: `r${Math.floor(i / calcsPerRoom) + 1}`,
    tool: "laminat",
    toolVersion: 2,
    surface: "floor" as const,
    input: { price_laminate: 1120 },
    openedAt: 5,
    addedAt: 5,
  })),
  prices: { "tile-adhesive||bag|25kg": 520 },
  totals: { sum: 1, byRoom: {}, saved: 0, missing: 0, at: 5 },
  activeRoomId: "r1",
  updatedAt: 5,
});
const valid = (e: Estimate) => {
  expect(migrateProject(e)).toEqual({ ok: true, data: e });
  return e;
};

describe("estimate snapshot (link without a server)", () => {
  it("round-trips the rooms, calcs and prices; drafts, totals and the active room stay home", async () => {
    const source = estimate("e1", 3);
    source.calcs.push({ id: "c9", roomId: "r1", tool: "oboi", toolVersion: 4, input: {}, openedAt: 6 });
    const back = await decodeSnapshot(await encodeSnapshot(source));
    expect(back?.rooms).toEqual(source.rooms);
    expect(back?.calcs.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
    expect(back?.prices).toEqual(source.prices);
    expect(back?.totals).toBeUndefined();
    expect(back?.activeRoomId).toBeUndefined();
  });

  it("a typical estimate fits the link; a broken one is no estimate", async () => {
    expect((await encodeSnapshot(estimate("e1", 6, 3))).length).toBeLessThan(SNAPSHOT_MAX);
    expect(await decodeSnapshot("not*base64")).toBeNull();
    expect(await decodeSnapshot("AAAA")).toBeNull();
    expect(await decodeSnapshot("A".repeat(SNAPSHOT_MAX + 1))).toBeNull();
  });

  it("a short link that unpacks to megabytes is dropped before it is read", async () => {
    // 4 MB of spaces deflate to a few kilobytes: it fits the link, not the unpack limit.
    const zeros = new Blob([new Uint8Array(4 * 1024 * 1024).fill(32)]).stream();
    const packed = new Uint8Array(
      await new Response(zeros.pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer(),
    );
    let text = "";
    for (const byte of packed) text += String.fromCharCode(byte);
    const link = btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(link.length).toBeLessThan(SNAPSHOT_MAX);
    expect(await decodeSnapshot(link)).toBeNull();
  });
});

describe("«Забрать себе»", () => {
  it("replace: their estimate under my id, first room active, no totals", () => {
    const mine = valid(replaceEstimate(estimate("theirs", 2), "mine", 9));
    expect(mine).toMatchObject({ id: "mine", activeRoomId: "r1", updatedAt: 9 });
    expect(mine.totals).toBeUndefined();
  });

  it("add: their rooms after mine with fresh ids and their calcs; my prices win; limits kept", () => {
    const mine = estimate("mine", 2);
    mine.prices = { "tile-adhesive||bag|25kg": 600 };
    const { estimate: merged, added } = mergeEstimate(mine, estimate("theirs", 2), 9);
    valid(merged);
    expect(added).toBe(2);
    expect(merged.rooms.map((r) => r.id)).toEqual(["r1", "r2", "r3", "r4"]);
    expect(merged.calcs.map((c) => [c.id, c.roomId])).toEqual([
      ["c1", "r1"],
      ["c2", "r2"],
      ["c3", "r3"],
      ["c4", "r4"],
    ]);
    expect(merged.prices["tile-adhesive||bag|25kg"]).toBe(600);
    expect(merged.activeRoomId).toBe("r1");

    const full = mergeEstimate(estimate("mine", ESTIMATE_LIMITS.rooms - 1), estimate("theirs", 3), 9);
    expect(full.added).toBe(1);
    valid(full.estimate);
  });
});
