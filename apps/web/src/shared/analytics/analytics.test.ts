import { describe, expect, it } from "vitest";
import { consentFrom, DECLINE_DAYS } from "./consent";
import { cleanUrl } from "./metrika";
import { eventParams } from "./track";

const DAY = 86_400_000;
const now = Date.parse("2026-10-11T12:00:00Z");
const daysAgo = (days: number) => new Date(now - days * DAY).toISOString();

describe("consentFrom", () => {
  it("asks when nothing or something broken is stored", () => {
    expect(consentFrom(undefined, now)).toBe("ask");
    expect(consentFrom({ choice: "maybe" as never, at: daysAgo(1) }, now)).toBe("ask");
    expect(consentFrom({ choice: "accepted", at: "not a date" }, now)).toBe("ask");
  });

  it("keeps a refusal for six months, then asks again", () => {
    expect(consentFrom({ choice: "declined", at: daysAgo(DECLINE_DAYS - 1) }, now)).toBe("declined");
    expect(consentFrom({ choice: "declined", at: daysAgo(DECLINE_DAYS + 1) }, now)).toBe("ask");
  });

  it("keeps an acceptance", () => {
    expect(consentFrom({ choice: "accepted", at: daysAgo(400) }, now)).toBe("accepted");
  });
});

describe("cleanUrl", () => {
  it("drops only the shared input", () => {
    expect(cleanUrl("https://umnyaut.com/pol/laminat/?s=eyJ4IjoxfQ&utm_source=ya")).toBe(
      "https://umnyaut.com/pol/laminat/?utm_source=ya",
    );
    expect(cleanUrl("https://umnyaut.com/pol/laminat/?s=abc")).toBe("https://umnyaut.com/pol/laminat/");
  });
});

describe("eventParams", () => {
  it("adds source, country and category but not the context tool", () => {
    expect(
      eventParams<"calc_completed">(
        { tool: "laminat", fieldsChanged: 3, via: "panel" },
        { country: "KZ", category: "pol", tool: "oboi" },
      ),
    ).toEqual({ source: "web", country: "KZ", category: "pol", tool: "laminat", fieldsChanged: 3, via: "panel" });
  });
});
