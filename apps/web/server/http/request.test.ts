import "server-only";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { BODY_MAX, checkOrigin, readJson } from "./request";
import { ApiError } from "./respond";

const request = (method: string, headers: Record<string, string>, body?: string) =>
  new Request("https://umnyaut.com/api/projects/", { method, headers, body });

const code = (run: () => unknown) => {
  try {
    run();
  } catch (error) {
    return error instanceof ApiError ? error.code : "other";
  }
  return "passed";
};

describe("checkOrigin", () => {
  it("lets same-origin writes and origin-less GETs through", () => {
    expect(code(() => checkOrigin(request("POST", { host: "umnyaut.com", origin: "https://umnyaut.com" })))).toBe(
      "passed",
    );
    expect(code(() => checkOrigin(request("GET", { host: "umnyaut.com" })))).toBe("passed");
  });

  it("refuses foreign origins and writes without Origin", () => {
    expect(code(() => checkOrigin(request("POST", { host: "umnyaut.com", origin: "https://evil.example" })))).toBe(
      "bad_origin",
    );
    expect(code(() => checkOrigin(request("GET", { host: "umnyaut.com", origin: "https://evil.example" })))).toBe(
      "bad_origin",
    );
    expect(code(() => checkOrigin(request("DELETE", { host: "umnyaut.com" })))).toBe("bad_origin");
    expect(code(() => checkOrigin(request("POST", { host: "umnyaut.com", origin: "null" })))).toBe("bad_origin");
  });
});

describe("readJson", () => {
  const schema = z.object({ a: z.number() });
  const read = (body: string) => readJson(request("POST", {}, body), schema);

  it("parses and validates", async () => {
    await expect(read('{"a":1}')).resolves.toEqual({ a: 1 });
    await expect(read("{")).rejects.toMatchObject({ code: "invalid_json" });
    await expect(read('{"a":"x"}')).rejects.toMatchObject({ code: "invalid_body" });
  });

  it("refuses NUL characters Postgres cannot store", async () => {
    await expect(read('{"a":1,"s":"x\\u0000"}')).rejects.toMatchObject({ code: "invalid_body" });
  });

  it("stops reading a chunked body past 64 KB", async () => {
    let pulled = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(16 * 1024).fill(32));
        if (pulled > 1_000) controller.close();
      },
    });
    const chunked = new Request("https://umnyaut.com/api/projects/", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);
    expect(chunked.headers.get("content-length")).toBeNull();
    await expect(readJson(chunked, schema)).rejects.toMatchObject({ code: "too_large" });
    expect(pulled).toBeLessThan(10);
  });

  it("refuses bodies over 64 KB", async () => {
    await expect(read(JSON.stringify({ a: 1, pad: "x".repeat(BODY_MAX) }))).rejects.toMatchObject({
      code: "too_large",
    });
  });
});
