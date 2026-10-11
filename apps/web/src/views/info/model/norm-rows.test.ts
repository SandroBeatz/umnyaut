import { norms } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { normGroups, splitSources } from "./norm-rows";

describe("methodology norm table", () => {
  it("lists every norm exactly once", () => {
    const ids = normGroups().flatMap((g) => g.rows.map((r) => r.id));
    expect(ids.sort()).toEqual(Object.keys(norms).sort());
  });

  it("splits sources into labels and links", () => {
    expect(splitSources("Ceresit CM 11 PRO, https://ceresit.ru/x/; по опыту укладчиков")).toEqual([
      { label: "Ceresit CM 11 PRO", url: "https://ceresit.ru/x/" },
      { label: "по опыту укладчиков" },
    ]);
  });
});
