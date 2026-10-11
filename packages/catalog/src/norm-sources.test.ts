import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { norms } from "./norms";

/** docs/code/norm-sources-wave-1.md is the register of sources: no norm without a row and a link there. */
const doc = readFileSync(join(import.meta.dirname, "../../../docs/code/norm-sources-wave-1.md"), "utf8");

describe("norm sources register", () => {
  for (const [id, norm] of Object.entries(norms)) {
    it(`${id} is documented and sourced`, () => {
      expect(doc, `add ${id} to docs/code/norm-sources-wave-1.md`).toContain(`\`${id}\``);
      if (!norm.unconfirmed) expect(norm.source, `${id} needs a link to its primary source`).toMatch(/https:\/\//);
      for (const url of norm.source.match(/https:\/\/[^\s;]+/g) ?? [])
        expect(doc, `${url} missing from the doc`).toContain(url);
    });
  }
});
