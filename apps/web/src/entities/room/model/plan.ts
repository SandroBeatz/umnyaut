import type { CutCorner, Opening, OpeningPlace } from "@umnyaut/calc";
import { roomOutline } from "@umnyaut/calc";

/** One door or window of the list (an opening with `count: 2` is two of them), with its place if marked. */
export interface PlanOpening {
  type: Opening["type"];
  widthMm: number;
  heightMm: number;
  place?: OpeningPlace;
}

/** The room as the plan sees it: size and the L-cut, if the tool has one. */
export interface PlanRoom {
  lengthMm: number;
  widthMm: number;
  cut?: { lengthMm: number; widthMm: number };
  cutCorner: CutCorner;
}

export const planOutline = (room: PlanRoom) => roomOutline(room.lengthMm, room.widthMm, room.cut, room.cutCorner);

/** Every counted opening on its own, so each can sit on its own wall. */
export function expand(openings: readonly Opening[]): PlanOpening[] {
  return openings.flatMap((o) =>
    Array.from({ length: o.count }, (_, k) => {
      const place = o.places?.[k];
      return { type: o.type, widthMm: o.widthMm, heightMm: o.heightMm, ...(place ? { place } : {}) };
    }),
  );
}

/**
 * Back to the room's openings, one per door or window (`count: 1`): areas and counts stay the same, and a
 * place never belongs to the wrong one of several equal openings.
 */
export function collapse(list: readonly PlanOpening[]): Opening[] {
  return list.map(({ place, ...o }) => ({ ...o, count: 1, ...(place ? { places: [place] } : {}) }));
}

/** A new opening in the middle of wall 1. */
export function centred(room: PlanRoom, opening: Omit<PlanOpening, "place">): PlanOpening {
  const wall = planOutline(room).walls[0];
  const offsetMm = Math.max(Math.round(((wall?.lengthMm ?? 0) - opening.widthMm) / 2), 0);
  return { ...opening, place: { wall: 0, offsetMm } };
}
