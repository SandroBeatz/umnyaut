import { toolModules } from "@umnyaut/calc";
import { describe, expect, it } from "vitest";
import { home } from "./home";
import { popularTools, tools } from "./registry";

describe("home", () => {
  it("every example card is an item its tool returns for the example room", () => {
    const ctx = { country: "RU" } as const;
    for (const work of home.works) {
      for (const example of work.items) {
        const tool = tools.find((t) => t.id === example.tool);
        expect(tool?.status, example.tool).toBe("live");
        const module = toolModules[example.tool];
        const values = { ...module.defaults(ctx), ...home.exampleRoom, ...example.values };
        const parsed = module.input.safeParse(values);
        expect(parsed.success, `${example.tool} input`).toBe(true);
        const result = module.compute(parsed.data as never, ctx);
        expect(
          result.items.some((i) => i.key === example.item),
          `${example.tool} → ${example.item}`,
        ).toBe(true);
      }
    }
  });

  it("popular tools are six live tools", () => {
    expect(popularTools()).toHaveLength(6);
  });
});
