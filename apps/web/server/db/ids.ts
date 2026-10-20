import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";

/** No look-alikes: 0/O/o, 1/l/I are left out (tech spec §9). Mirrors the check in 0002_projects.sql. */
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
export const PROJECT_ID = /^[2-9a-kmnp-zA-HJ-NP-Z]{8}$/;

export function newProjectId(): string {
  let id = "";
  for (let i = 0; i < 8; i++) id += ALPHABET[randomInt(ALPHABET.length)];
  return id;
}

/** 256 random bits; only the browser keeps it, the DB keeps its hash. */
export function newEditToken(): string {
  return randomBytes(32).toString("base64url");
}

export const EDIT_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function hashEditToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
