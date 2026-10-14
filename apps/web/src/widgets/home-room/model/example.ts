import { type Country, floorAreaM2, type RoomType, wallAreaM2 } from "@umnyaut/calc";
import { DEFAULT_COUNTRY, home } from "@umnyaut/catalog";
import { NBSP, plural } from "@umnyaut/ui/format";
import type { RoomDraft } from "@/entities/room";

/** The room the example is computed for: what the active room knows over the 4 × 3 м example room. */
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

/** The type chip selected when the page opens (and the example room's type). */
export const DEFAULT_TYPE: RoomType = "living";

/** Works of the example strip for a room type. */
export const worksOf = (type: RoomType): readonly string[] => home.typeWorks[type];

const sameRoom = (a: ExampleRoom, b: ExampleRoom) => JSON.stringify(a) === JSON.stringify(b);

/** True while the page still shows its first state, so the server's cards stand and nothing is recomputed. */
export function isInitialExample(room: ExampleRoom, type: RoomType, country: Country): boolean {
  const first = worksOf(DEFAULT_TYPE);
  const works = worksOf(type);
  return (
    country === DEFAULT_COUNTRY &&
    sameRoom(room, exampleRoom(null)) &&
    works.length === first.length &&
    works.every((w) => first.includes(w))
  );
}

/** «1 дверь, 2 окна»; empty when the room has none. */
export function openingsText(room: ExampleRoom): string {
  const t = home.room;
  const count = (type: "door" | "window") =>
    room.openings.filter((o) => o.type === type).reduce((n, o) => n + o.count, 0);
  return (
    [
      [count("door"), t.doorForms],
      [count("window"), t.windowForms],
    ] as const
  )
    .filter(([n]) => n > 0)
    .map(([n, forms]) => `${n}${NBSP}${plural(n, forms)}`)
    .join(", ");
}

/** Floor, walls and ceiling of the room the block shows — the box of its scheme, doors and windows taken out. */
export function surfacesOf(room: ExampleRoom) {
  const box = { shape: "rect", ...room } as const;
  const floor = floorAreaM2(box);
  return { floorM2: floor, wallsM2: wallAreaM2(box).areaM2, ceilingM2: floor };
}
