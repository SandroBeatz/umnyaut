// Lighthouse CI with a filled list of purchases (P17.15): the tile page — the heaviest calculator with the estimate's
// shared block — and `/spisok/`, measured as a returning visitor sees them. `scripts/lighthouse-seed.cjs` writes the
// estimate before each URL; Lighthouse 12 clears the HTTP cache and service workers between runs but not localStorage
// (`clearStorageTypes`), so every run is a cold load with the list in place. Run after `pnpm build`:
// `pnpm --filter web lighthouse:estimate`. CI sets CHROME_PATH: with a puppeteerScript LHCI otherwise asks puppeteer-core
// for a browser it does not ship, and the healthcheck fails.
//
// Gates from the plan: CLS ≤ 0.05 and a11y ≥ 0.95. First-screen JS ≤ 250 KB stays with `js:check` (the list changes
// no first-screen script). Measured 2026-10-19 and kept as warnings: the list's room is applied after mount, so the
// late result (and a hint such as «Грунтовки нужно всего 0,56 л…») becomes the LCP — 4.0–4.2 s against 3.4 s with an
// empty list, performance 0.72–0.84; the calculators the list needs add ≈ 33 KB of scripts loaded on demand.
const runs = { aggregationMethod: "median-run" };

const assertions = {
  "categories:accessibility": ["error", { minScore: 0.95, ...runs }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.05, ...runs }],
  "resource-summary:third-party:count": ["error", { maxNumericValue: 0 }],
  "categories:performance": ["warn", { minScore: 0.85, ...runs }],
  "largest-contentful-paint": ["warn", { maxNumericValue: 4000, ...runs }],
};

const base = "http://localhost:3401";

module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm exec next start -p 3401",
      startServerReadyPattern: "Ready",
      url: [`${base}/plitka/plitka/`, `${base}/spisok/`],
      numberOfRuns: 3,
      puppeteerScript: "./scripts/lighthouse-seed.cjs",
      puppeteerLaunchOptions: { args: ["--no-sandbox", "--headless=new"] },
    },
    assert: { assertions },
    upload: { target: "filesystem", outputDir: ".lighthouseci-estimate" },
  },
};
