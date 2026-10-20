import "server-only";
import { describe, expect, it } from "vitest";
import { clientKey } from "./index";
import { MemoryLimiter } from "./memory";

describe("MemoryLimiter", () => {
  it("allows max hits per window, then refuses until the next window", () => {
    const limiter = new MemoryLimiter();
    const hits = [0, 1, 2].map(() => limiter.hit("k", 2, 60_000, 1_000));
    expect(hits).toEqual([true, true, false]);
    expect(limiter.hit("other", 2, 60_000, 1_000)).toBe(true);
    expect(limiter.hit("k", 2, 60_000, 61_000)).toBe(true);
  });

  it("stays bounded under many keys", () => {
    const limiter = new MemoryLimiter(100);
    for (let i = 0; i < 1_000; i++) limiter.hit(`k${i}`, 1, 60_000, 1_000);
    expect(limiter.hit("fresh", 1, 60_000, 1_000)).toBe(true);
  });
});

describe("clientKey", () => {
  const day = new Date("2026-10-20T12:00:00Z");

  it("never contains the IP and is stable within a day", () => {
    const key = clientKey("203.0.113.7", day, "secret");
    expect(key).not.toContain("203");
    expect(key).toHaveLength(22);
    expect(clientKey("203.0.113.7", new Date("2026-10-20T23:59:00Z"), "secret")).toBe(key);
  });

  it("changes with the day, the IP and the secret", () => {
    const key = clientKey("203.0.113.7", day, "secret");
    expect(clientKey("203.0.113.7", new Date("2026-10-21T00:00:00Z"), "secret")).not.toBe(key);
    expect(clientKey("203.0.113.8", day, "secret")).not.toBe(key);
    expect(clientKey("203.0.113.7", day, "other")).not.toBe(key);
  });
});
