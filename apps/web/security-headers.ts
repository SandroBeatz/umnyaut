/**
 * Response headers for every page (tech spec §7 and §16). Same on Vercel and the VPS; Caddy repeats HSTS,
 * nosniff and Referrer-Policy for its own responses.
 *
 * Static pages carry Next's inline bootstrap scripts and cannot get a per-request nonce, so scripts allow
 * `'unsafe-inline'` from our own origin plus Metrika (loaded only after consent). Frames: our domain and
 * Telegram (Web App in web.telegram.org) — the widget routes (`/embed/*`, Phase 15) will get their own rule.
 */
const METRIKA = ["https://mc.yandex.ru", "https://mc.yandex.com", "https://mc.yandex.kz", "https://mc.yandex.by"];

export function contentSecurityPolicy(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...METRIKA, "https://yastatic.net"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...METRIKA],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...METRIKA, ...METRIKA.map((origin) => origin.replace("https://", "wss://"))],
    "frame-src": ["blob:", ...METRIKA],
    "child-src": ["blob:", ...METRIKA],
    "worker-src": ["'self'", "blob:"],
    "frame-ancestors": ["'self'", "https://web.telegram.org", "https://*.telegram.org"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

export function securityHeaders(): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "geolocation=(), microphone=(), payment=(), usb=()" },
  ];
}
