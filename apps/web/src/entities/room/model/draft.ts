import type { EstimateRoom } from "@umnyaut/calc";

/**
 * “My room” as the user has filled it so far: the shape part of the estimate's room. Every part is optional: the
 * room area tool knows no height, so nothing is invented. Lengths in integer mm.
 */
export type RoomDraft = Omit<EstimateRoom, "id" | "name" | "type">;
