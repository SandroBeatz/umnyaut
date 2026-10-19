import { metrika } from "@/shared/config/analytics";

type Ym = ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[][]; l?: number };
declare global {
  interface Window {
    ym?: Ym;
  }
}

/** The address Metrika sees: the `s` parameter (the whole input of a shared calculation) is removed. */
export function cleanUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("s");
  return url.toString();
}

/** Counter configured and this is the production host. */
export function metrikaEnabled(): boolean {
  return metrika.id !== undefined && window.location.hostname === metrika.host;
}

let loaded = false;

/** Adds tag.js once (after consent only); hits are sent by hand so the URL can be cleaned. */
export function loadMetrika(): void {
  const id = metrika.id;
  if (loaded || id === undefined) return;
  loaded = true;
  const ym: Ym =
    window.ym ??
    Object.assign(
      (...args: unknown[]) => {
        ym.a = ym.a ?? [];
        ym.a.push(args);
      },
      { l: Date.now() },
    );
  window.ym = ym;
  const script = document.createElement("script");
  script.async = true;
  script.src = `${metrika.script}?id=${id}`;
  document.head.append(script);
  ym(id, "init", { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}

export function metrikaHit(href: string, referer?: string): void {
  if (metrika.id === undefined || !window.ym) return;
  window.ym(metrika.id, "hit", cleanUrl(href), referer ? { referer: cleanUrl(referer) } : {});
}

export function metrikaGoal(name: string, params: object): void {
  if (metrika.id === undefined || !window.ym) return;
  window.ym(metrika.id, "reachGoal", name, params);
}

/**
 * After a refusal: Metrika's cookies are removed and, if the counter already runs on this page, the page reloads
 * so nothing more is sent (tag.js has no way to stop).
 */
export function forgetMetrika(): void {
  const host = window.location.hostname;
  for (const name of document.cookie.split("; ").map((c) => c.split("=")[0] ?? "")) {
    if (!name.startsWith("_ym")) continue;
    for (const domain of ["", `; domain=${host}`, `; domain=.${host}`]) {
      // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is missing in older Safari and Firefox, and the reload right after needs a synchronous delete
      document.cookie = `${name}=; max-age=0; path=/${domain}`;
    }
  }
  if (loaded) window.location.reload();
}
