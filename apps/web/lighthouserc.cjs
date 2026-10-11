// Lighthouse CI (plan P9.7): mobile profile against the production build, 3 runs, median. Run:
// `pnpm --filter web lighthouse` after `pnpm build`. The planner page joins with Phase 11.
//
// Budget decided by the owner on 2026-10-11 (development plan, open question 12): React + Next alone are
// ≈ 136 KB gzip, so the spec's 150 KB / LCP 2.0 s does not fit pages that run a calculator. Lab gates per page
// type below (measured locally after P9.11 with headroom for runner noise); first-screen JS weight is checked
// by `scripts/js-weight.mjs` (`pnpm --filter web js:check`), because Lighthouse's script total also counts link
// prefetches. The real target is field LCP p75 ≤ 2.5 s (Metrika, CrUX) once the counter runs.
const runs = { aggregationMethod: "median-run" };

const everywhere = {
  "categories:seo": ["error", { minScore: 1, ...runs }],
  "categories:accessibility": ["error", { minScore: 0.95, ...runs }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.05, ...runs }],
  "resource-summary:stylesheet:size": ["error", { maxNumericValue: 15 * 1024 }],
  "resource-summary:font:count": ["error", { maxNumericValue: 2 }],
  "resource-summary:third-party:count": ["error", { maxNumericValue: 0 }],
};

/** Text and category pages: measured LCP 2.1–2.9 s, performance 0.94–0.99. */
const light = {
  ...everywhere,
  "categories:performance": ["error", { minScore: 0.9, ...runs }],
  "largest-contentful-paint": ["error", { maxNumericValue: 3000, ...runs }],
};

/** Home and tool pages: measured LCP 3.3–3.5 s, performance 0.86–0.94. */
const calculator = {
  ...everywhere,
  "categories:performance": ["error", { minScore: 0.85, ...runs }],
  "largest-contentful-paint": ["error", { maxNumericValue: 4000, ...runs }],
};

const base = "http://localhost:3400";

module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm exec next start -p 3400",
      startServerReadyPattern: "Ready",
      url: [`${base}/`, `${base}/pol/laminat/`, `${base}/steny/oboi/`, `${base}/pol/`, `${base}/metodika/`],
      numberOfRuns: 3,
      settings: { chromeFlags: "--no-sandbox --headless=new" },
    },
    assert: {
      assertMatrix: [
        { matchingUrlPattern: "localhost:3400/(metodika|pol)/$", assertions: light },
        { matchingUrlPattern: "localhost:3400/($|[a-z-]+/[a-z-]+/$)", assertions: calculator },
      ],
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
