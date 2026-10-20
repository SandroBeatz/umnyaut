// @vitest-environment jsdom
import type { Estimate } from "@umnyaut/calc";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteShortLink, hasShortLink, LINK_KEY, shortLink } from "./link";

const estimate: Estimate = {
  schemaVersion: 2,
  id: "e1",
  name: "Ремонт",
  country: "RU",
  rooms: [{ id: "r1", name: "", type: "living" }],
  calcs: [
    { id: "c1", roomId: "r1", tool: "laminat", toolVersion: 3, input: {}, openedAt: 5, addedAt: 5, draft: { a: 1 } },
    { id: "c2", roomId: "r1", tool: "plintus", toolVersion: 2, input: {}, openedAt: 6 },
  ],
  prices: {},
  totals: { sum: 0, byRoom: {}, saved: 0, missing: 0, at: 1 },
  activeRoomId: "r1",
  updatedAt: 7,
};

type Call = { url: string; method: string; token: string | null; body: { data: Estimate } | undefined };

function server(answers: Array<[number, unknown]>) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const headers = new Headers(init.headers);
      calls.push({
        url,
        method: String(init.method),
        token: headers.get("x-edit-token"),
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      });
      const [status, body] = answers.shift() ?? [500, { ok: false, error: { code: "internal" } }];
      return new Response(JSON.stringify(body), { status });
    }),
  );
  return calls;
}

const created = (id: string) => [201, { ok: true, data: { id, editToken: `t-${id}` } }] as [number, unknown];
const fail = (status: number, code: string) => [status, { ok: false, error: { code } }] as [number, unknown];

describe("shortLink", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("creates a link with the snapshot only and keeps the token", async () => {
    const calls = server([created("abcd2345")]);
    expect(await shortLink(estimate)).toBe(`${window.location.origin}/p/abcd2345/`);
    expect(calls[0]).toMatchObject({ url: "/api/projects/", method: "POST" });
    const sent = calls[0]?.body?.data;
    expect(sent?.calcs.map((c) => c.id)).toEqual(["c1"]);
    expect(sent).not.toHaveProperty("totals");
    expect(sent).not.toHaveProperty("activeRoomId");
    expect(sent?.calcs[0]).not.toHaveProperty("draft");
    expect(JSON.parse(localStorage.getItem(LINK_KEY) ?? "")).toEqual({
      estimateId: "e1",
      id: "abcd2345",
      editToken: "t-abcd2345",
    });
  });

  it("refreshes the same link next time", async () => {
    const calls = server([created("abcd2345"), [200, { ok: true, data: { id: "abcd2345" } }]]);
    await shortLink(estimate);
    expect(await shortLink({ ...estimate, name: "Дача" })).toBe(`${window.location.origin}/p/abcd2345/`);
    expect(calls[1]).toMatchObject({ url: "/api/projects/abcd2345/", method: "PUT", token: "t-abcd2345" });
    expect(calls[1]?.body?.data.name).toBe("Дача");
  });

  it("makes a new link when the old one is gone", async () => {
    server([created("abcd2345"), fail(404, "not_found"), created("efgh6789")]);
    await shortLink(estimate);
    expect(await shortLink(estimate)).toBe(`${window.location.origin}/p/efgh6789/`);
    expect(JSON.parse(localStorage.getItem(LINK_KEY) ?? "").id).toBe("efgh6789");
  });

  it("does not reuse another estimate's link", async () => {
    const calls = server([created("abcd2345"), created("efgh6789")]);
    await shortLink(estimate);
    await shortLink({ ...estimate, id: "e2" });
    expect(calls.map((c) => c.method)).toEqual(["POST", "POST"]);
  });

  it("gives up without a server, so the caller falls back to the # link", async () => {
    server([fail(503, "db_unavailable")]);
    expect(await shortLink(estimate)).toBeUndefined();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await shortLink(estimate)).toBeUndefined();
    expect(localStorage.getItem(LINK_KEY)).toBeNull();
  });

  it("keeps the saved link when a refresh fails for another reason", async () => {
    server([created("abcd2345"), fail(429, "rate_limited")]);
    await shortLink(estimate);
    expect(await shortLink(estimate)).toBeUndefined();
    expect(JSON.parse(localStorage.getItem(LINK_KEY) ?? "").id).toBe("abcd2345");
  });
});

describe("deleteShortLink", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("deletes by the owner's token and forgets the link", async () => {
    const calls = server([created("abcd2345"), [200, { ok: true, data: { id: "abcd2345" } }]]);
    await shortLink(estimate);
    expect(hasShortLink("e1")).toBe(true);
    expect(hasShortLink("e2")).toBe(false);
    expect(await deleteShortLink("e1")).toBe(true);
    expect(calls[1]).toMatchObject({ url: "/api/projects/abcd2345/", method: "DELETE", token: "t-abcd2345" });
    expect(hasShortLink("e1")).toBe(false);
  });

  it("counts a link already gone as deleted", async () => {
    server([created("abcd2345"), fail(404, "not_found")]);
    await shortLink(estimate);
    expect(await deleteShortLink("e1")).toBe(true);
    expect(localStorage.getItem(LINK_KEY)).toBeNull();
  });

  it("keeps the link when the server could not delete it", async () => {
    server([created("abcd2345"), fail(503, "db_unavailable")]);
    await shortLink(estimate);
    expect(await deleteShortLink("e1")).toBe(false);
    expect(hasShortLink("e1")).toBe(true);
  });
});
