import type { ToolId, ToolModule } from "@umnyaut/calc";
import type { ToolValues } from "./module";

type Loaded = Promise<{ module: ToolModule }>;

/** Each calculator in its own chunk: a page loads only the modules it computes (the room list, on demand). */
const loaders: Record<ToolId, () => Loaded> = {
  "ploshchad-komnaty": () => import("@umnyaut/calc/modules/ploshchad-komnaty"),
  "ploshchad-sten": () => import("@umnyaut/calc/modules/ploshchad-sten"),
  oboi: () => import("@umnyaut/calc/modules/oboi"),
  kraska: () => import("@umnyaut/calc/modules/kraska"),
  plintus: () => import("@umnyaut/calc/modules/plintus"),
  klej: () => import("@umnyaut/calc/modules/klej"),
  zatirka: () => import("@umnyaut/calc/modules/zatirka"),
  linoleum: () => import("@umnyaut/calc/modules/linoleum"),
  laminat: () => import("@umnyaut/calc/modules/laminat"),
  plitka: () => import("@umnyaut/calc/modules/plitka"),
};

export async function loadToolModule(id: ToolId): Promise<ToolModule<ToolValues>> {
  return (await loaders[id]()).module as unknown as ToolModule<ToolValues>;
}
