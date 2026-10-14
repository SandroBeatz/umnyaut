// @vitest-environment jsdom
import { ESTIMATE_LIMITS, type Estimate, migrateProject } from "@umnyaut/calc";
import { beforeEach, describe, expect, it } from "vitest";
import { fromLegacy, LIST_KEY, legacyList, legacyRoom, ROOM_KEY } from "./legacy";
import * as ops from "./ops";
import { ESTIMATE_KEY, hydrateEstimate, selectActiveRoom, useEstimateStore } from "./store";

const id = () => "e1";
/** The step's result passes the estimate schema (ids, rooms of calcs, limits). */
const valid = (estimate: Estimate) => {
  expect(migrateProject(estimate)).toEqual({ ok: true, data: estimate });
  return estimate;
};

describe("estimate steps", () => {
  it("the first size creates the estimate and «Комната 1» silently; later sizes merge, undefined erases nothing", () => {
    const first = valid(ops.patchActiveRoom(null, { lengthMm: 4600, widthMm: undefined }, 1, id));
    expect(first).toMatchObject({ id: "e1", name: "Ремонт квартиры", country: "RU", activeRoomId: "r1", updatedAt: 1 });
    expect(first.rooms).toEqual([{ id: "r1", name: "Комната 1", type: "other", lengthMm: 4600 }]);
    const second = valid(ops.patchActiveRoom(first, { widthMm: 4300, lengthMm: undefined }, 2, id));
    expect(ops.activeRoomOf(second)).toEqual({
      id: "r1",
      name: "Комната 1",
      type: "other",
      lengthMm: 4600,
      widthMm: 4300,
    });
  });

  it("rooms: new ones take a free name and become active; removing one takes its calcs along", () => {
    let e = ops.patchActiveRoom(null, { lengthMm: 4600 }, 1, id);
    e = ops.addRoom(e, { name: "Ванная", type: "bathroom" }, 2).estimate;
    e = ops.addRoom(e, {}, 3).estimate;
    expect(e.rooms.map((r) => [r.id, r.name])).toEqual([
      ["r1", "Комната 1"],
      ["r2", "Ванная"],
      ["r3", "Комната 3"],
    ]);
    expect(e.activeRoomId).toBe("r3");
    e = ops.addCalc(e, { roomId: "r2", tool: "plitka", toolVersion: 3, input: {} }, 4).estimate;
    e = ops.removeRoom(ops.setActiveRoom(e, "r2"), "r2", 5);
    valid(e);
    expect(e.rooms.map((r) => r.id)).toEqual(["r1", "r3"]);
    expect(e.calcs).toEqual([]);
    expect(e.activeRoomId).toBe("r1");
    expect(ops.addRoom(e, {}, 6).estimate.rooms.at(-1)?.name).toBe("Комната 2");
    expect(ops.removeRoom(ops.removeRoom(e, "r1", 7), "r3", 7)).not.toHaveProperty("activeRoomId");
  });

  it("clearing the geometry keeps the room's name, type and calcs", () => {
    let e = ops.patchActiveRoom(null, { lengthMm: 4600, widthMm: 4300, openings: [] }, 1, id);
    e = ops.updateRoom(e, "r1", { name: "Спальня", type: "bedroom" }, 2);
    e = ops.addCalc(e, { roomId: "r1", tool: "laminat", toolVersion: 1, input: {} }, 3).estimate;
    const cleared = valid(ops.clearRoomGeometry(e, "r1", 4));
    expect(cleared.rooms).toEqual([{ id: "r1", name: "Спальня", type: "bedroom" }]);
    expect(cleared.calcs).toHaveLength(1);
  });

  it("saving a room replaces it; new walls numbering resets the wall-bound fields of its calcs only (Р10)", () => {
    let e = ops.patchActiveRoom(null, { lengthMm: 4600, widthMm: 4300, heightMm: 2700 }, 1, id);
    const wallpaper = { startMode: "manual", startWall: 3, repeatMm: 640 };
    e = ops.addCalc(e, { roomId: "r1", tool: "oboi", toolVersion: 4, input: wallpaper }, 2).estimate;
    e = ops.addRoom(e, {}, 3).estimate;
    e = ops.addCalc(e, { roomId: "r2", tool: "oboi", toolVersion: 4, input: wallpaper }, 3).estimate;
    const bound = { oboi: ["startMode", "startWall", "startLineMm", "mainWall", "zones"] };
    const resized = ops.saveRoom(
      e,
      "r1",
      { name: "Зал", type: "living", shape: "rect", lengthMm: 5000, widthMm: 4300 },
      bound,
      4,
    );
    expect(resized.estimate.rooms[0]).toEqual({
      id: "r1",
      name: "Зал",
      type: "living",
      shape: "rect",
      lengthMm: 5000,
      widthMm: 4300,
    });
    expect(resized.estimate.calcs[0]?.input).toEqual(wallpaper);
    const l = {
      name: "Зал",
      type: "living" as const,
      shape: "l" as const,
      lengthMm: 5000,
      widthMm: 4300,
      cutLengthMm: 1500,
      cutWidthMm: 1200,
    };
    const reshaped = valid(ops.saveRoom(e, "r1", l, bound, 5).estimate);
    expect(reshaped.calcs.map((c) => c.input)).toEqual([{ repeatMm: 640 }, wallpaper]);
    expect(ops.wallNumbering({ ...l, cutCorner: "nw" })).toBe("l-nw");
    expect(ops.wallNumbering({ ...l, cutLengthMm: 5000 })).toBe("rect");
    const added = ops.saveRoom(e, undefined, { name: "Кухня", type: "kitchen" }, bound, 6);
    expect(added.id).toBe("r3");
    expect(added.estimate.activeRoomId).toBe("r3");
  });

  it("keeps the limits: 20 rooms, 60 calcs", () => {
    let e = ops.createEstimate("e1", 0);
    for (let i = 0; i < ESTIMATE_LIMITS.rooms + 1; i++) e = ops.addRoom(e, {}, i).estimate;
    expect(e.rooms).toHaveLength(ESTIMATE_LIMITS.rooms);
    expect(ops.addRoom(e, {}, 99).id).toBeUndefined();
    for (let i = 0; i < ESTIMATE_LIMITS.calcs + 1; i++) {
      e = ops.addCalc(e, { roomId: "r1", tool: "laminat", toolVersion: 1, input: {} }, i).estimate;
    }
    expect(e.calcs).toHaveLength(ESTIMATE_LIMITS.calcs);
    valid(e);
    expect(ops.addCalc(e, { roomId: "r1", tool: "laminat", toolVersion: 1, input: {} }, 99).id).toBeUndefined();
    expect(ops.splitCalc(e, "c1", ["floor", "walls"], 99).id).toBeUndefined();
  });

  it("calcs: a calc for a room that is not there is refused; updates move openedAt; added once", () => {
    let e = ops.patchActiveRoom(null, {}, 1, id);
    expect(ops.addCalc(e, { roomId: "r9", tool: "plitka", toolVersion: 3, input: {} }, 2).id).toBeUndefined();
    e = ops.addCalc(e, { roomId: "r1", tool: "plitka", toolVersion: 3, input: {} }, 2).estimate;
    expect(e.calcs[0]).toEqual({ id: "c1", roomId: "r1", tool: "plitka", toolVersion: 3, input: {}, openedAt: 2 });
    e = ops.updateCalc(e, "c1", { label: "белая", input: { jointMm: 3 } }, 3);
    e = ops.markAdded(e, "c1", 4);
    e = ops.markAdded(e, "c1", 5);
    expect(e.calcs[0]).toMatchObject({ label: "белая", input: { jointMm: 3 }, openedAt: 4, addedAt: 4 });
  });

  it("remove → «Вернуть» puts the calc back in its place, not into a removed room", () => {
    let e = ops.patchActiveRoom(null, {}, 1, id);
    for (const tool of ["plitka", "klej", "zatirka"]) {
      e = ops.addCalc(e, { roomId: "r1", tool, toolVersion: 1, input: {} }, 2).estimate;
    }
    const { estimate, removed } = ops.removeCalc(e, "c2", 3);
    expect(estimate.calcs.map((c) => c.id)).toEqual(["c1", "c3"]);
    if (!removed) throw new Error("not removed");
    expect(ops.restoreCalc(estimate, removed, 4).calcs.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
    expect(ops.restoreCalc(ops.removeRoom(estimate, "r1", 4), removed, 5).calcs).toEqual([]);
    expect(ops.removeCalc(e, "c9", 3).removed).toBeUndefined();
  });

  it("«Разделить»: one calc over «Пол и стены» becomes two with the same input", () => {
    let e = ops.patchActiveRoom(null, {}, 1, id);
    e = ops.addCalc(
      e,
      {
        roomId: "r1",
        tool: "plitka",
        toolVersion: 4,
        surface: "floor-walls",
        label: "белая",
        input: { jointMm: 2 },
        addedAt: 1,
      },
      1,
    ).estimate;
    e = ops.addCalc(e, { roomId: "r1", tool: "kraska", toolVersion: 1, input: {} }, 1).estimate;
    const { estimate, id: copy } = ops.splitCalc(e, "c1", ["walls", "floor"], 2);
    valid(estimate);
    expect(copy).toBe("c3");
    expect(estimate.calcs.map((c) => [c.id, c.tool, c.surface, c.label, c.input, c.addedAt])).toEqual([
      ["c1", "plitka", "walls", "белая", { jointMm: 2 }, 1],
      ["c3", "plitka", "floor", "белая", { jointMm: 2 }, 1],
      ["c2", "kraska", undefined, undefined, {}, undefined],
    ]);
  });

  it("prices of shared consumables by product key; totals keep their time", () => {
    let e = ops.createEstimate("e1", 0);
    e = ops.setPrice(e, "primer||can|10|l", 1290, 1);
    e = ops.setPrice(e, "grout|white|bag|2|kg", 450, 2);
    e = ops.setPrice(e, "primer||can|10|l", undefined, 3);
    expect(e.prices).toEqual({ "grout|white|bag|2|kg": 450 });
    e = ops.setTotals(e, { sum: 11_200, byRoom: {}, saved: 0, missing: 1 }, 4);
    expect(valid(e).totals).toEqual({ sum: 11_200, byRoom: {}, saved: 0, missing: 1, at: 4 });
  });

  it("the room list on the estimate: one calc per tool in the active room, a second put replaces the input", () => {
    let e = ops.putToolCalc(null, { tool: "oboi", toolVersion: 4, input: { repeatMm: 640 } }, 1, id);
    e = ops.putToolCalc(e, { tool: "kraska", toolVersion: 1, input: {} }, 2, id);
    e = ops.putToolCalc(e, { tool: "oboi", toolVersion: 4, input: {} }, 3, id);
    valid(e);
    expect(e.calcs.map((c) => [c.id, c.roomId, c.tool, c.input, c.addedAt])).toEqual([
      ["c1", "r1", "oboi", {}, 1],
      ["c2", "r1", "kraska", {}, 2],
    ]);
    e = ops.addRoom(e, {}, 4).estimate;
    e = ops.putToolCalc(e, { tool: "oboi", toolVersion: 4, input: {} }, 5, id);
    expect(e.calcs.map((c) => [c.id, c.roomId])).toEqual([
      ["c1", "r1"],
      ["c2", "r1"],
      ["c3", "r2"],
    ]);
  });
});

describe("edits of a calc in the estimate wait for «Обновить в списке»", () => {
  it("a draft holds the edits; the same input again clears it; commit saves it with the surface", () => {
    let e = ops.patchActiveRoom(null, { lengthMm: 4600 }, 1, id);
    e = ops.addCalc(e, { roomId: "r1", tool: "plitka", toolVersion: 4, surface: "floor", input: {} }, 2).estimate;
    e = ops.markAdded(e, "c1", 3);
    e = valid(ops.setDraft(e, "c1", { surface: "walls", tileLengthMm: 600 }, 4));
    expect(e.calcs[0]).toMatchObject({ input: {}, draft: { surface: "walls", tileLengthMm: 600 } });
    expect(ops.setDraft(e, "c1", undefined, 5).calcs[0]?.draft).toBeUndefined();
    const saved = valid(ops.commitDraft(e, "c1", { surface: "walls", toolVersion: 5 }, 6));
    expect(saved.calcs[0]).toMatchObject({
      input: { surface: "walls", tileLengthMm: 600 },
      surface: "walls",
      toolVersion: 5,
      addedAt: 3,
    });
    expect(saved.calcs[0]?.draft).toBeUndefined();
    expect(ops.commitDraft(saved, "c1", { surface: "walls", toolVersion: 5 }, 7)).toBe(saved);
  });
});

describe("move from «Моя комната» and the room list", () => {
  it("reads the old room and list, dropping broken data and repeated tools", () => {
    expect(legacyRoom({ room: { lengthMm: 4600, widthMm: 4300 } })).toEqual({ lengthMm: 4600, widthMm: 4300 });
    expect(legacyRoom({ room: { lengthMm: -1 } })).toBeNull();
    expect(legacyRoom({ room: {} })).toBeNull();
    expect(legacyRoom(null)).toBeNull();
    expect(
      legacyList({
        entries: [
          { tool: "oboi", input: { repeatMm: 640 } },
          { tool: "Nope!", input: {} },
          { tool: "kraska" },
          { tool: "oboi", input: {} },
        ],
      }),
    ).toEqual([{ tool: "oboi", input: {} }]);
    expect(legacyList(null)).toEqual([]);
  });

  it("the old room becomes «Комната 1», the list its calcs in the estimate", () => {
    const room = {
      room: {
        lengthMm: 4600,
        widthMm: 4300,
        heightMm: 2700,
        shape: "l",
        cutLengthMm: 1500,
        cutWidthMm: 1200,
        cutCorner: "nw",
      },
    };
    const list = {
      entries: [
        { tool: "oboi", input: { repeatMm: 640 } },
        { tool: "kraska", input: { surface: "ceiling" } },
      ],
    };
    const estimate = valid(fromLegacy(room, list, 7, "e1") as Estimate);
    expect(estimate.rooms).toEqual([{ id: "r1", name: "Комната 1", type: "other", ...room.room }]);
    expect(estimate.calcs).toEqual([
      { id: "c1", roomId: "r1", tool: "oboi", toolVersion: 0, input: { repeatMm: 640 }, openedAt: 7, addedAt: 7 },
      {
        id: "c2",
        roomId: "r1",
        tool: "kraska",
        toolVersion: 0,
        input: { surface: "ceiling" },
        openedAt: 7,
        addedAt: 7,
      },
    ]);
    expect(fromLegacy(null, { entries: [{ tool: "oboi", input: {} }] }, 7, "e1")?.rooms).toEqual([
      { id: "r1", name: "Комната 1", type: "other" },
    ]);
    expect(fromLegacy({ room: {} }, { entries: [] }, 7, "e1")).toBeNull();
  });
});

describe("estimate store", () => {
  const stored = (key: string, state: unknown) => localStorage.setItem(key, JSON.stringify({ state, version: 1 }));

  beforeEach(() => {
    localStorage.clear();
    useEstimateStore.setState({ estimate: null, removed: null });
  });

  it("persists under the versioned key; reads nothing until hydrated", async () => {
    useEstimateStore.getState().patchActiveRoom({ lengthMm: 4600 });
    const saved = JSON.parse(localStorage.getItem(ESTIMATE_KEY) ?? "");
    expect(saved.version).toBe(1);
    expect(saved.state.estimate.rooms).toEqual([{ id: "r1", name: "Комната 1", type: "other", lengthMm: 4600 }]);
    // Setting the state writes it too, so the stored copy is put back before reading.
    const raw = localStorage.getItem(ESTIMATE_KEY) ?? "";
    useEstimateStore.setState({ estimate: null });
    expect(selectActiveRoom(useEstimateStore.getState())).toBeNull();
    localStorage.setItem(ESTIMATE_KEY, raw);
    await useEstimateStore.persist.rehydrate();
    expect(selectActiveRoom(useEstimateStore.getState())).toMatchObject({ lengthMm: 4600 });
  });

  it("broken stored data is no estimate", async () => {
    stored(ESTIMATE_KEY, { estimate: { schemaVersion: 2, rooms: "nope" } });
    await useEstimateStore.persist.rehydrate();
    expect(useEstimateStore.getState().estimate).toBeNull();
  });

  it("remove and undo put the calc back in its place", () => {
    const s = useEstimateStore.getState;
    s().patchActiveRoom({ lengthMm: 4600 });
    s().addCalc({ roomId: "r1", tool: "oboi", toolVersion: 4, input: {}, addedAt: 1 });
    s().addCalc({ roomId: "r1", tool: "kraska", toolVersion: 1, input: {} });
    s().removeCalc("c1");
    expect(s().estimate?.calcs.map((c) => c.id)).toEqual(["c2"]);
    s().undoRemove();
    expect(s().estimate?.calcs.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("hydration moves the old keys once and removes them after the estimate is written", async () => {
    stored(ROOM_KEY, { room: { lengthMm: 3000, widthMm: 2500 } });
    stored(LIST_KEY, { entries: [{ tool: "laminat", input: {} }] });
    await hydrateEstimate();
    const room = selectActiveRoom(useEstimateStore.getState());
    expect(room).toMatchObject({ name: "Комната 1", lengthMm: 3000, widthMm: 2500 });
    expect(useEstimateStore.getState().estimate?.calcs.map((c) => c.tool)).toEqual(["laminat"]);
    expect(localStorage.getItem(ROOM_KEY)).toBeNull();
    expect(localStorage.getItem(LIST_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(ESTIMATE_KEY) ?? "").state.estimate.rooms[0].lengthMm).toBe(3000);
  });
});
