import type { Country } from "@umnyaut/calc";
import { home, packNouns, type ToolDef, toolPath, tools } from "@umnyaut/catalog";
import { applyRoom, type RoomDraft } from "@/entities/room";
import { getToolModule, groupPurchases, purchaseTexts, quantityText } from "@/entities/tool";

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

export interface ExampleCard {
  key: string;
  tool: ToolDef;
  href: string;
  title: string;
  photo?: string;
  /** «пачка 2,22 м²», «по 2,7 л». */
  pack: string;
  /** «6 пачек». */
  quantity: string;
}

/**
 * Material cards of the example strip for the selected works, computed by the tools themselves (rule 1: code
 * computes). A card whose tool rejects the room (out of its limits) is left out rather than guessed.
 */
export function exampleCards(room: ExampleRoom, works: readonly string[], country: Country): ExampleCard[] {
  const draft: RoomDraft = { shape: "rect", ...room };
  return home.works
    .filter((work) => works.includes(work.id))
    .flatMap((work) => work.items)
    .flatMap((example): ExampleCard[] => {
      const tool = tools.find((t) => t.id === example.tool);
      if (!tool) return [];
      const module = getToolModule(tool.id);
      const own = example.values ?? {};
      const values = { ...applyRoom(module.defaults({ country }), draft, tool.fields), ...own };
      const parsed = module.input.safeParse(values);
      if (!parsed.success) return [];
      const result = module.compute(parsed.data, { country });
      const group = groupPurchases(result.items).find((g) => g.first.key === example.item);
      if (!group) return [];
      const { quantity, detail } = purchaseTexts(group);
      const { kind, size } = group.first.pack;
      const item = tool.items?.[example.item];
      return [
        {
          key: `${tool.id}:${example.item}`,
          tool,
          href: toolPath(tool),
          title: example.title ?? item?.title ?? tool.title,
          photo: item?.photo,
          pack: detail ?? `${packNouns[kind][0]} ${quantityText(size.value, size.unit)}`,
          quantity,
        },
      ];
    });
}
