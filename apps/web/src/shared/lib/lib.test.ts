import { describe, expect, it } from "vitest";
import { fromBase64Url, toBase64Url } from "./base64url";
import { sourceLinks, splitSources } from "./sources";
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

  it("adds the word in the form for the value", () => {
    const t = "выходит {n|полоса|полосы|полос}";
    expect(fill(t, { n: 1 })).toBe("выходит 1\u00a0полоса");
    expect(fill(t, { n: "3" })).toBe("выходит 3\u00a0полосы");
    expect(fill(t, { n: 11 })).toBe("выходит 11\u00a0полос");
    expect(fill("{n|пачка|пачки|пачек}", { n: "2,5" })).toBe("2,5\u00a0пачки");
    expect(fill("{n|пачка|пачки|пачек}", {})).toBe("{n|пачка|пачки|пачек}");
  });
});

describe("sources", () => {
  it("splits sources into labels and links", () => {
    expect(splitSources("Ceresit CM 11 PRO, https://ceresit.ru/x/; по опыту укладчиков")).toEqual([
      { label: "Ceresit CM 11 PRO", url: "https://ceresit.ru/x/" },
      { label: "по опыту укладчиков" },
    ]);
  });

  it("lists each source of several norms once", () => {
    expect(
      sourceLinks([
        "Ceresit CM 11 PRO, https://ceresit.ru/x/",
        "Arbiton INDO, карточка изделия (длина 250 см), https://arbiton.com/indo; Ceresit CM 11 PRO, https://ceresit.ru/x/",
      ]),
    ).toEqual([
      { label: "Ceresit CM 11 PRO", url: "https://ceresit.ru/x/" },
      { label: "Arbiton INDO, карточка изделия (длина 250 см)", url: "https://arbiton.com/indo" },
    ]);
  });
});
