import { describe, expect, it } from "vitest";
import { formatDimensions, formatMoney, formatNumber, formatQuantity, NBSP, plural, THIN_NBSP } from "./index";

const pack = { one: "пачка", few: "пачки", many: "пачек" };

describe("formatNumber", () => {
  it("uses a decimal comma and thin NBSP thousands", () => {
    expect(formatNumber(19.8)).toBe("19,8");
    expect(formatNumber(12460)).toBe(`12${THIN_NBSP}460`);
    expect(formatNumber(1234567.891)).toBe(`1${THIN_NBSP}234${THIN_NBSP}567,89`);
  });
  it("respects fraction digits and uses a real minus", () => {
    expect(formatNumber(0.25, { maxFraction: 1 })).toBe("0,3");
    expect(formatNumber(3, { minFraction: 1 })).toBe("3,0");
    expect(formatNumber(-3)).toBe("−3");
  });
});

describe("formatMoney", () => {
  it("formats each market's currency with whole units and NBSP", () => {
    expect(formatMoney(12460, "RU")).toBe(`12${THIN_NBSP}460${NBSP}₽`);
    expect(formatMoney(8500, "KZ")).toBe(`8${THIN_NBSP}500${NBSP}₸`);
    expect(formatMoney(45, "BY")).toBe(`45${NBSP}Br`);
    expect(formatMoney(1200, "KG")).toBe(`1${THIN_NBSP}200${NBSP}сом`);
  });
  it("rounds to whole units by default", () => {
    expect(formatMoney(99.6, "RU")).toBe(`100${NBSP}₽`);
    expect(formatMoney(99.6, "RU", { maxFraction: 2 })).toBe(`99,6${NBSP}₽`);
  });
});

describe("plural", () => {
  it.each([
    [1, "пачка"],
    [2, "пачки"],
    [5, "пачек"],
    [11, "пачек"],
    [21, "пачка"],
    [22, "пачки"],
    [111, "пачек"],
    [2.5, "пачки"],
  ])("%d → %s", (count, form) => {
    expect(plural(count, pack)).toBe(form);
  });
});

describe("formatQuantity / formatDimensions", () => {
  it("keeps number and unit together", () => {
    expect(formatQuantity(10, pack)).toBe(`10${NBSP}пачек`);
  });
  it("joins dimensions with ×", () => {
    expect(formatDimensions([4.6, 4.3, 2.7], "м")).toBe(`4,6${NBSP}×${NBSP}4,3${NBSP}×${NBSP}2,7${NBSP}м`);
  });
});
