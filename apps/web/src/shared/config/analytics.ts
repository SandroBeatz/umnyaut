/**
 * Yandex Metrika (P0.4, A10). The counter id is public — it is in every page's HTML once loaded. Metrika runs
 * only on the production host, so staging, previews and local runs never mix into the statistics.
 */
export const metrika = {
  /** Counter «Умняут», created by the owner on 2026-10-19; `undefined` would switch Metrika off. */
  id: 113671906 as number | undefined,
  host: "umnyaut.com",
  script: "https://mc.yandex.ru/metrika/tag.js",
} as const;
