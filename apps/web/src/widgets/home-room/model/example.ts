import type { Country } from "@umnyaut/calc";
import { DEFAULT_COUNTRY, home } from "@umnyaut/catalog";
import type { RoomDraft } from "@/entities/room";

/** The room the example is computed for: what “My room” knows over the 4 × 3 м example room. */
export type ExampleRoom = Required<Pick<RoomDraft, "lengthMm" | "widthMm" | "heightMm" | "openings">>;

export function exampleRoom(room: RoomDraft | null): ExampleRoom {
  return {
    lengthMm: room?.lengthMm ?? home.exampleRoom.lengthMm,
    widthMm: room?.widthMm ?? home.exampleRoom.widthMm,
    heightMm: room?.heightMm ?? home.exampleRoom.heightMm,
    openings: room?.openings ?? home.exampleRoom.openings,
  };
}

/** Plain data, so the server can hand the example's cards to the page without the browser recomputing them. */
export interface ExampleCard {
  key: string;
  toolTitle: string;
  href: string;
  title: string;
  photo?: string;
  /** «пачка 2,22 м²», «по 2,7 л». */
  pack: string;
  /** «6 пачек». */
  quantity: string;
}

/** Works selected when the page opens. */
export const defaultWorks = (): string[] => home.works.filter((w) => w.selected).map((w) => w.id);

const sameRoom = (a: ExampleRoom, b: ExampleRoom) => JSON.stringify(a) === JSON.stringify(b);

/** True while the page still shows its first state, so the server's cards stand and nothing is recomputed. */
export function isInitialExample(room: ExampleRoom, works: readonly string[], country: Country): boolean {
  const first = defaultWorks();
  return (
    country === DEFAULT_COUNTRY &&
    sameRoom(room, exampleRoom(null)) &&
    works.length === first.length &&
    works.every((w) => first.includes(w))
  );
}
