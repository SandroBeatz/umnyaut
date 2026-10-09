import "server-only";

/**
 * Client IP as seen by our own reverse proxy (Caddy on the VPS, Vercel on staging).
 * The proxy appends the peer address to `X-Forwarded-For`, so the last entry is the
 * one we trust; earlier entries can be forged by the client.
 */
export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const last = forwarded.split(",").at(-1)?.trim();
    if (last) return last;
  }
  return headers.get("x-real-ip")?.trim() || null;
}
