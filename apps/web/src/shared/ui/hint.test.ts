import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = join(import.meta.dirname, "../..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
  });

describe("mascot in hints", () => {
  it("hints use the cat's head only: the whole-cat warn pose appears nowhere but the dev gallery", () => {
    const offenders = files(src).filter(
      (f) =>
        !f.includes("/views/dev-ui/") && !f.includes(".test.") && readFileSync(f, "utf8").includes("mascotImages.warn"),
    );
    expect(offenders).toEqual([]);
  });
});
