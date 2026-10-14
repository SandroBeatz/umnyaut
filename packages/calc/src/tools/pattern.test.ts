import { describe, expect, it } from "vitest";
import { linoleum } from "./linoleum";
import { oboi } from "./oboi";
import { upgradeInput } from "./pattern";

const ctx = { country: "RU" } as const;

describe("input from before the pattern toggle", () => {
  it("a repeat above zero turns the pattern on; zero leaves it off; a set toggle stays", () => {
    expect(upgradeInput(oboi, { repeatMm: 640 })).toEqual({ repeatMm: 640, pattern: true });
    expect(upgradeInput(oboi, { repeatMm: 0 })).toEqual({ repeatMm: 0, pattern: false });
    expect(upgradeInput(oboi, { repeatMm: 640, pattern: false })).toEqual({ repeatMm: 640, pattern: false });
    expect(upgradeInput(oboi, { lengthMm: 4000 })).toEqual({ lengthMm: 4000 });
  });

  it("an old wallpaper link with a 64 cm repeat still buys for the repeat", () => {
    const old = { repeatMm: 640 };
    const upgraded = oboi.compute(oboi.input.parse({ ...oboi.defaults(ctx), ...upgradeInput(oboi, old) }), ctx);
    const on = oboi.compute(oboi.input.parse({ ...oboi.defaults(ctx), repeatMm: 640, pattern: true }), ctx);
    const off = oboi.compute(oboi.input.parse({ ...oboi.defaults(ctx), repeatMm: 640, pattern: false }), ctx);
    expect(upgraded).toEqual(on);
    expect(upgraded.steps).not.toEqual(off.steps);
  });

  it("an old linoleum link with a repeat keeps it", () => {
    const old = { repeatMm: 1000 };
    const upgraded = linoleum.compute(
      linoleum.input.parse({ ...linoleum.defaults(ctx), ...upgradeInput(linoleum, old) }),
      ctx,
    );
    const plain = linoleum.compute(linoleum.input.parse({ ...linoleum.defaults(ctx), repeatMm: 0 }), ctx);
    expect(upgraded.steps).not.toEqual(plain.steps);
  });
});

describe("tile calc says what the adhesive and grout tools would", () => {
  it("a 0,3 mm joint and a 120 × 60 tile get the grout and adhesive warnings", async () => {
    const { plitka } = await import("./plitka");
    const input = plitka.input.parse({ ...plitka.defaults(ctx), jointMm: 0.3, tileLengthMm: 1200, tileWidthMm: 600 });
    const codes = plitka.compute(input, ctx).warnings.map((w) => w.code);
    expect(codes).toContain("joint_too_narrow");
    expect(codes).toContain("large_format");
  });
});
