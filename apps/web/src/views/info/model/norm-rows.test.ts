import { norms } from "@umnyaut/catalog";
import { describe, expect, it } from "vitest";
import { normGroups } from "./norm-rows";

describe("methodology norm table", () => {
  it("lists every norm exactly once", () => {
    const ids = normGroups().flatMap((g) => g.rows.map((r) => r.id));
    expect(ids.sort()).toEqual(Object.keys(norms).sort());
  });
});
