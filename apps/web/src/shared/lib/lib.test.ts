import { describe, expect, it } from "vitest";
import { fromBase64Url, toBase64Url } from "./base64url";
import { fill } from "./template";

describe("base64url", () => {
  it("round-trips UTF-8 and uses the URL-safe alphabet without padding", () => {
    const text = JSON.stringify({ shape: "l", note: "Г-образная ✓", n: [1, 2] });
    const encoded = toBase64Url(text);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(fromBase64Url(encoded)).toBe(text);
  });

  it("rejects garbage instead of throwing", () => {
    expect(fromBase64Url("not base64!")).toBeUndefined();
    expect(fromBase64Url("_w")).toBeUndefined(); // 0xFF is not valid UTF-8
  });
});

describe("fill", () => {
  it("replaces known placeholders and keeps unknown ones", () => {
    expect(fill("От {min} до {max} {unit}", { min: "0,3", max: 100, unit: "м" })).toBe("От 0,3 до 100 м");
    expect(fill("{a} {b}", { a: 1 })).toBe("1 {b}");
  });
});
