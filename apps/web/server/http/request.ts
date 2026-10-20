import "server-only";
import type { z } from "zod";
import { ApiError } from "./respond";

/** Request body cap (tech spec §9). */
export const BODY_MAX = 64 * 1024;

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Same-origin only (tech spec §9): a foreign `Origin` is refused; a write without `Origin` is refused too, since
 * browsers always send it on POST/PUT/DELETE. Same-origin GETs come without it.
 */
export function checkOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    if (MUTATING.has(request.method)) throw new ApiError("bad_origin", "Origin header required");
    return;
  }
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    throw new ApiError("bad_origin", "Malformed Origin");
  }
  const own = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!own || host !== own) throw new ApiError("bad_origin", "Cross-origin request");
}

/**
 * Reads the body chunk by chunk and stops past `BODY_MAX`: a chunked upload without `Content-Length` must not be
 * buffered whole (Next sets no limit on route handlers).
 */
async function readText(request: Request): Promise<string> {
  const tooLarge = () => new ApiError("too_large", `Body over ${BODY_MAX} bytes`);
  if (Number(request.headers.get("content-length") ?? 0) > BODY_MAX) throw tooLarge();
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > BODY_MAX) {
      await reader.cancel();
      throw tooLarge();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Reads at most `BODY_MAX` bytes of JSON and validates it. */
export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const text = await readText(request);
  // Postgres text and jsonb cannot hold U+0000; refuse it here rather than fail in the DB.
  if (text.includes("\\u0000")) throw new ApiError("invalid_body", "NUL character in body");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ApiError("invalid_json", "Body is not JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ApiError("invalid_body", "Body does not match the schema");
  return parsed.data;
}
