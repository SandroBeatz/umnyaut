import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare, shareUrl } from "./encode";

const defaults = { lengthMm: 4600, widthMm: 4300, openings: [{ type: "door", widthMm: 800 }] };

describe("share encoding", () => {
  it("keeps only changed fields and round-trips them", () => {
    const values = { ...defaults, widthMm: 3000, openings: [] };
    const s = encodeShare(values, defaults);
    expect(decodeShare(s)).toEqual({ widthMm: 3000, openings: [] });
  });

  it("gives no parameter for defaults and a clean URL", () => {
    expect(encodeShare(defaults, defaults)).toBeUndefined();
    expect(shareUrl("https://umnyaut.com/osnova/ploshchad-sten/?s=old#x", defaults, defaults)).toBe(
      "https://umnyaut.com/osnova/ploshchad-sten/",
    );
  });

  it("builds a link with ?s=", () => {
    const url = new URL(
      shareUrl("https://umnyaut.com/osnova/ploshchad-sten/", { ...defaults, lengthMm: 5000 }, defaults),
    );
    expect(decodeShare(url.searchParams.get("s"))).toEqual({ lengthMm: 5000 });
  });

  it("ignores broken parameters", () => {
    expect(decodeShare(null)).toBeUndefined();
    expect(decodeShare("%%%")).toBeUndefined();
    expect(decodeShare(Buffer.from("[1,2]").toString("base64url"))).toBeUndefined();
    expect(decodeShare(Buffer.from("{oops").toString("base64url"))).toBeUndefined();
  });
});
