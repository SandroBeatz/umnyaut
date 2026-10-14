import { ESTIMATE_LIMITS, type Estimate, nextId } from "@umnyaut/calc";
import { useEstimateStore } from "./store";

/**
 * «Забрать себе» → «Заменить мою» (spec «Экспорт»): the shared estimate becomes this device's, under this device's id,
 * its first room active and its totals recounted on the next open.
 */
export function replaceEstimate(theirs: Estimate, id: string, now: number): Estimate {
  const { totals: _, activeRoomId: __, ...rest } = theirs;
  const first = theirs.rooms[0];
  return { ...rest, id, ...(first ? { activeRoomId: first.id } : {}), updatedAt: now };
}

/**
 * «Забрать себе» → «Добавить комнаты в мою»: their rooms after mine with their calcs, fresh ids; past the limits the
 * rest is left out. Shared-consumable prices I have stay mine. `added` — how many rooms came over.
 */
export function mergeEstimate(mine: Estimate, theirs: Estimate, now: number): { estimate: Estimate; added: number } {
  const rooms = [...mine.rooms];
  const calcs = [...mine.calcs];
  const roomIds = new Map<string, string>();
  for (const room of theirs.rooms) {
    if (rooms.length >= ESTIMATE_LIMITS.rooms) break;
    const id = nextId("r", rooms);
    roomIds.set(room.id, id);
    rooms.push({ ...room, id });
  }
  for (const calc of theirs.calcs) {
    const roomId = roomIds.get(calc.roomId);
    if (!roomId || calcs.length >= ESTIMATE_LIMITS.calcs) continue;
    calcs.push({ ...calc, id: nextId("c", calcs), roomId, openedAt: now });
  }
  const added = roomIds.size;
  if (added === 0) return { estimate: mine, added };
  return {
    estimate: { ...mine, rooms, calcs, prices: { ...theirs.prices, ...mine.prices }, updatedAt: now },
    added,
  };
}

/**
 * «Забрать себе» a shared estimate into this device's: replace mine, or add its rooms to mine. Kept out of the store,
 * so calculator pages do not carry it. Returns how many rooms came over.
 */
export function adoptEstimate(theirs: Estimate, mode: "replace" | "add"): number {
  const { estimate } = useEstimateStore.getState();
  if (mode === "add" && estimate) {
    const result = mergeEstimate(estimate, theirs, Date.now());
    useEstimateStore.setState({ estimate: result.estimate });
    return result.added;
  }
  const id = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  useEstimateStore.setState({ estimate: replaceEstimate(theirs, id, Date.now()), removed: null });
  return theirs.rooms.length;
}
