/** Our API's error codes (server/http) plus `network` when no answer came. The UI maps them to catalog strings. */
export type ApiErrorCode =
  | "bad_origin"
  | "invalid_json"
  | "invalid_body"
  | "too_large"
  | "not_found"
  | "rate_limited"
  | "db_unavailable"
  | "internal"
  | "network";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: ApiErrorCode };

/**
 * Calls our own API (`/api/…/`, trailing slash — the site has `trailingSlash`) and unwraps the envelope
 * `{ ok, data | error }`. Never throws: an offline phone or a non-JSON answer is `network`.
 */
export async function callApi<T>(
  path: string,
  init: { method: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; headers?: Record<string, string> },
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: init.method,
      headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }), ...init.headers },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      cache: "no-store",
    });
    const envelope = (await response.json()) as { ok: true; data: T } | { ok: false; error: { code: ApiErrorCode } };
    return envelope.ok ? { ok: true, data: envelope.data } : { ok: false, code: envelope.error.code };
  } catch {
    return { ok: false, code: "network" };
  }
}
