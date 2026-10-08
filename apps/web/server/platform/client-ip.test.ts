import "server-only";
import { describe, expect, it } from "vitest";
import { getClientIp } from "./client-ip";

describe("getClientIp", () => {
  it("takes the last X-Forwarded-For entry", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("falls back to X-Real-IP", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  it("returns null without proxy headers", () => {
    expect(getClientIp(new Headers())).toBeNull();
  });
});
