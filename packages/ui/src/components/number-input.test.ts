import { describe, expect, it } from "vitest";
import { displayDecimal, parseDecimal, sanitiseTyping } from "./number-input";

describe("parseDecimal", () => {
  it.each([
    ["4,6", 4.6],
    ["4.6", 4.6],
    ["1 200,5", 1200.5],
    ["4,6 м", 4.6],
    ["−2", -2],
    [",5", 0.5],
    ["12,", 12],
  ])("%s → %d", (text, value) => {
    expect(parseDecimal(text)).toBe(value);
  });
  it("returns null for empty input and NaN for garbage", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("  ")).toBeNull();
    expect(parseDecimal("1,2,3")).toBeNaN();
  });
});

describe("displayDecimal / sanitiseTyping", () => {
  it("shows a decimal comma without float noise", () => {
    expect(displayDecimal(0.1 + 0.2)).toBe("0,3");
    expect(displayDecimal(null)).toBe("");
  });
  it("turns dots into commas and keeps one separator", () => {
    expect(sanitiseTyping("4.6", false)).toBe("4,6");
    expect(sanitiseTyping("4,6,7", false)).toBe("4,67");
    expect(sanitiseTyping("-3a", false)).toBe("3");
    expect(sanitiseTyping("-3", true)).toBe("-3");
  });
});
