import "server-only";
import { describe, expect, it } from "vitest";
import { EDIT_TOKEN, hashEditToken, newEditToken, newProjectId, PROJECT_ID } from "./ids";

describe("project ids and edit tokens", () => {
  it("makes 8-char ids without look-alikes", () => {
    for (let i = 0; i < 500; i++) {
      const id = newProjectId();
      expect(id).toMatch(PROJECT_ID);
      expect(id).not.toMatch(/[01OolI]/);
    }
  });

  it("makes 256-bit tokens and hashes them to SHA-256 hex", () => {
    const token = newEditToken();
    expect(token).toMatch(EDIT_TOKEN);
    expect(newEditToken()).not.toBe(token);
    expect(hashEditToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashEditToken(token)).toBe(hashEditToken(token));
    expect(hashEditToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
