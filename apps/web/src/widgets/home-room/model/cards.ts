import type { Country } from "@umnyaut/calc";
import { DEFAULT_COUNTRY, home, packNouns, toolPath, tools } from "@umnyaut/catalog";
import { formatNumber, NBSP } from "@umnyaut/ui/format";
import { applyRoom, type RoomDraft } from "@/entities/room";
import { getToolModule, groupPurchases, purchaseTexts, quantityText } from "@/entities/tool";
import { DEFAULT_TYPE, type ExampleCard, type ExampleRoom, exampleRoom, worksOf } from "./example";

/*
 * Kept apart from `example.ts`: it pulls in every calculator. The server computes the first state; the browser
 * loads this only when the room, its type or the country differ from it.
 */

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
      const { kind, size, width } = group.first.pack;
      // A roll is named by width × length («рулон 0,53 × 10,05 м»): the length alone reads as any roll.
      const packSize =
        kind === "roll" && width && width.unit === size.unit
          ? `${formatNumber(width.value, { maxFraction: 2 })}${NBSP}×${NBSP}${quantityText(size.value, size.unit)}`
          : quantityText(size.value, size.unit);
      const item = tool.items?.[example.item];
      return [
        {
          key: `${tool.id}:${example.item}`,
          toolTitle: tool.title,
          href: toolPath(tool),
          title: example.title ?? item?.title ?? tool.title,
          photo: item?.photo,
          pack: detail ?? `${packNouns[kind][0]} ${packSize}`,
          quantity,
        },
      ];
    });
}

/** The page's first state — the example room, its type's works, the default country — computed on the server. */
export function initialExample(): ExampleCard[] {
  return exampleCards(exampleRoom(null), worksOf(DEFAULT_TYPE), DEFAULT_COUNTRY);
}
