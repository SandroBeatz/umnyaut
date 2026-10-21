// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { EVENTS_PATH, setAnalyticsContext, track } from "./track";

describe("track → own counter", () => {
  afterEach(() => {
    setAnalyticsContext({});
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the name, tool, country and source only, without consent", () => {
    const beacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { ...navigator, sendBeacon: beacon });
    setAnalyticsContext({ country: "KZ", category: "pol", tool: "laminat" });
    track("calc_completed", { tool: "laminat", fieldsChanged: 3, via: "panel" });
    expect(beacon).toHaveBeenCalledOnce();
    const [path, body] = beacon.mock.calls[0] as unknown as [string, string];
    expect(path).toBe(EVENTS_PATH);
    expect(JSON.parse(body)).toEqual({ event: "calc_completed", tool: "laminat", country: "KZ", source: "web" });
  });

  it("falls back to fetch when the beacon is refused, and never throws", () => {
    const fetcher = vi.fn(() => Promise.reject(new TypeError("offline")));
    vi.stubGlobal("navigator", { ...navigator, sendBeacon: () => false });
    vi.stubGlobal("fetch", fetcher);
    expect(() => track("project_shared", { channel: "link" })).not.toThrow();
    expect(fetcher).toHaveBeenCalledWith(EVENTS_PATH, expect.objectContaining({ method: "POST", keepalive: true }));
  });
});
