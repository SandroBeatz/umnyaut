// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { roomDimensions } from "./format";
import { hydrateRoom, migrateRoom, ROOM_KEY, useRoomStore } from "./store";

describe("migrateRoom", () => {
  it("keeps a valid room and drops broken data", () => {
    expect(migrateRoom({ room: { lengthMm: 4600, widthMm: 4300 } }, 1)).toEqual({
      room: { lengthMm: 4600, widthMm: 4300 },
    });
    expect(migrateRoom({ room: { lengthMm: -1 } }, 1)).toEqual({ room: null });
    expect(migrateRoom(null, 0)).toEqual({ room: null });
    expect(migrateRoom({ room: {} }, 1)).toEqual({ room: null });
  });
});

describe("room store", () => {
  beforeEach(() => {
    localStorage.clear();
    useRoomStore.setState({ room: null });
  });

  it("merges parts, ignores undefined and persists under the versioned key", () => {
    useRoomStore.getState().updateRoom({ lengthMm: 4600, widthMm: undefined });
    useRoomStore.getState().updateRoom({ widthMm: 4300 });
    expect(useRoomStore.getState().room).toEqual({ lengthMm: 4600, widthMm: 4300 });
    expect(JSON.parse(localStorage.getItem(ROOM_KEY) ?? "")).toEqual({
      state: { room: { lengthMm: 4600, widthMm: 4300 } },
      version: 1,
    });
  });

  it("does not read storage until hydrated", async () => {
    localStorage.setItem(ROOM_KEY, JSON.stringify({ state: { room: { heightMm: 2700 } }, version: 1 }));
    expect(useRoomStore.getState().room).toBeNull();
    await hydrateRoom();
    expect(useRoomStore.getState().room).toEqual({ heightMm: 2700 });
  });
});

describe("roomDimensions", () => {
  // Non-breaking spaces keep the dimensions on one line.
  const nb = (text: string) => text.replace(/ /g, "\u00a0");

  it("formats known parts only", () => {
    expect(roomDimensions({ lengthMm: 4600, widthMm: 4300, heightMm: 2700 }, "м")).toBe(nb("4,6 × 4,3 × 2,7 м"));
    expect(roomDimensions({ lengthMm: 4600, widthMm: 4300 }, "м")).toBe(nb("4,6 × 4,3 м"));
    expect(roomDimensions({ heightMm: 2700 }, "м")).toBeUndefined();
    expect(roomDimensions(null, "м")).toBeUndefined();
  });
});
