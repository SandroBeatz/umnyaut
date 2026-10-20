import "server-only";

export type ErrorCode =
  | "bad_origin"
  | "invalid_json"
  | "invalid_body"
  | "too_large"
  | "not_found"
  | "rate_limited"
  | "db_unavailable"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
  bad_origin: 403,
  invalid_json: 400,
  invalid_body: 400,
  too_large: 413,
  not_found: 404,
  rate_limited: 429,
  db_unavailable: 503,
  internal: 500,
};

/** API responses never get cached: they carry a project or a fresh token. */
const NO_STORE = { "Cache-Control": "private, no-store" };

/** `{ ok: true, data }` (tech spec §9). */
export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, data }, { status, headers: NO_STORE });
}

/** `{ ok: false, error: { code, message } }`; the message is for logs and developers, the UI maps the code. */
export function fail(code: ErrorCode, message: string, headers?: Record<string, string>): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status: STATUS[code], headers: { ...NO_STORE, ...headers } },
  );
}

/** Thrown inside a handler to answer with an error envelope. */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
