import type { ToolId } from "@umnyaut/calc";
import type { CategorySlug } from "../categories";

/** Common to every input field. `name` is the key in the calc module's input. */
interface FieldBase {
  name: string;
  label: string;
  /** Shown on the phone's first screen; at most four per tool (registry test). */
  main?: boolean;
  /** Shown in the planner's short form. */
  planner?: boolean;
  hint?: string;
  /** Shown only while other fields have these values, e.g. the cut-out only for `shape: "l"`. */
  when?: Readonly<Record<string, string>>;
}

/** Parts of “My room” a field reads and writes. */
export type RoomBinding = "length" | "width" | "height" | "cutLength" | "cutWidth";

/**
 * Form described by data (tech spec §6 + design spec §18 `main` flag). Lengths are stored in mm;
 * `unit` is what the field shows first, `min`/`max` are mm.
 */
export type FieldDef =
  | (FieldBase & {
      kind: "length";
      unit: "m" | "cm" | "mm";
      min: number;
      max: number;
      /** Reads and writes “My room” directly. */
      room?: RoomBinding;
    })
  | (FieldBase & { kind: "number"; min: number; max: number; step?: number; unit?: string })
  | (FieldBase & {
      kind: "select";
      options: readonly { value: string; label: string }[];
      /** `shape` reads and writes the room shape. */
      room?: "shape";
    })
  | (FieldBase & { kind: "toggle" })
  | (FieldBase & { kind: "price" /** Purchase item key the pack price belongs to. */; item: string })
  /** Windows and doors list; always bound to the openings of “My room”. */
  | (FieldBase & { kind: "openings" })
  | { kind: "preset"; label: string; presets: readonly string[]; main?: boolean };

/** Fills several fields at once («Обычная комната 18 м²»). */
export interface PresetDef {
  id: string;
  label: string;
  values: Readonly<Record<string, unknown>>;
}

/** Display data for a purchase item key returned by `compute()`. */
export interface ItemDef {
  title: string;
  /** Material photo key in the image pipeline (`materialImages`); none → category icon. */
  photo?: string;
}

export interface ToolDef {
  /** One id everywhere: calc module, URL segment, content file, analytics. */
  id: ToolId;
  category: CategorySlug;
  /** Short name for navigation and cards («Площадь комнаты»); page H1 and title live in content frontmatter. */
  title: string;
  /** What the tool gives, for cards: «Площадь пола и периметр». */
  outcome?: string;
  /** `draft` pages are built but `noindex` and left out of listings meant for search. */
  status: "draft" | "live";
  fields: readonly FieldDef[];
  presets?: readonly PresetDef[];
  /** «Дальше по ремонту»: tools that continue the work with the same room. */
  nextSteps?: readonly ToolId[];
  /** Safety disclaimer card (radiators, cable, screed). */
  disclaimer?: boolean;
  items?: Readonly<Record<string, ItemDef>>;
  /** Text per warning code; `{name}` is replaced by the formatted number from the warning's values. */
  warnings?: Readonly<Record<string, string>>;
  /** Label per summary key; the first summary entry is the main result of a tool without purchase items. */
  summary?: Readonly<Record<string, string>>;
  /** Text per step code of “How calculated”, same placeholders. */
  steps?: Readonly<Record<string, string>>;
  /** Norm ids this tool uses (see norms.ts); “How calculated” lists their sources. */
  norms?: readonly string[];
}
