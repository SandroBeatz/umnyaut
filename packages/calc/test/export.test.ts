import { describe, expect, it } from "vitest";
import { exportRows, toCsv, toMarkdown } from "../scripts/export-golden";
import { demoGolden, demoTool } from "./fixtures/demo-tool";

describe("calc:export", () => {
  const rows = exportRows(demoTool, demoGolden);

  it("one row per example with non-default input, our result, source and benchmark", () => {
    expect(rows).toHaveLength(10);
    expect(rows[0]).toMatchObject({ tool: "demo", version: 1, example: "10 m²", input: "areaM2=10" });
    expect(rows[0]?.result).toBe("paint: 1 × 2,5 l (need 2,4)");
    expect(rows[0]?.source).toBe("manual: 10 × 0.12 × 2 = 2.4 l");
    expect(rows[1]).toMatchObject({ input: "defaults", benchmark: 'qalculator {"items":{"paint":{"packs":2}}}' });
  });

  it("renders Markdown and CSV with escaping", () => {
    const md = toMarkdown([{ ...(rows[0] as (typeof rows)[0]), example: "a|b" }]);
    expect(md.split("\n")[0]).toBe("| tool | version | example | input | expected | result | source | benchmark |");
    expect(md).toContain("a\\|b");
    expect(toCsv([{ ...(rows[0] as (typeof rows)[0]), example: 'say "hi"' }])).toContain('"say ""hi"""');
  });
});
