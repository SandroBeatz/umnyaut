import { describe, expect, it } from "vitest";
import { detectCountry } from "./country";

describe("detectCountry", () => {
  it("maps CIS time zones and falls back to RU", () => {
    expect(detectCountry("Asia/Almaty")).toBe("KZ");
    expect(detectCountry("Europe/Minsk")).toBe("BY");
    expect(detectCountry("Asia/Bishkek")).toBe("KG");
    expect(detectCountry("Europe/Moscow")).toBe("RU");
    expect(detectCountry(undefined)).toBe("RU");
  });
});
