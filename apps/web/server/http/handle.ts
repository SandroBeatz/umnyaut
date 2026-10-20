import "server-only";
import { checkLimit, type LimitRule } from "@server/limits";
import { DbError } from "@umnyaut/db";
import { checkOrigin } from "./request";
import { ApiError, fail } from "./respond";

/** Postgres codes for data the DB refuses: check violation, string too long, number out of range, untranslatable char. */
const BAD_DATA = new Set(["23514", "22001", "22003", "22P05"]);

export interface HandleOptions {
  /** Log name: the route pattern, never the concrete URL (it holds a project id). */
  route: string;
  limit?: LimitRule;
}

/**
 * Wraps a route handler: Origin check, rate limit, error envelope and one log line per request — route, method,
 * status, duration. Never the IP or the project (tech spec §9).
 */
export async function handle(
  request: Request,
  { route, limit }: HandleOptions,
  run: () => Promise<Response>,
): Promise<Response> {
  const started = performance.now();
  let response: Response;
  try {
    checkOrigin(request);
    if (limit && !(await checkLimit(request.headers, limit))) {
      throw new ApiError("rate_limited", "Too many requests", { "Retry-After": String(limit.windowSeconds) });
    }
    response = await run();
  } catch (error) {
    if (error instanceof ApiError) {
      response = fail(error.code, error.message, error.headers);
    } else if (error instanceof DbError && error.code && BAD_DATA.has(error.code)) {
      // Zod let through what a DB check refused: still the client's data, not our failure.
      response = fail("invalid_body", "Data refused by the database");
    } else {
      console.error(`[api] ${request.method} ${route}`, error);
      response = fail("internal", "Internal error");
    }
  }
  console.info(`[api] ${request.method} ${route} ${response.status} ${Math.round(performance.now() - started)}ms`);
  return response;
}
