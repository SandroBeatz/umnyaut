// Lighthouse CI (plan P9.7): mobile profile against the production build, thresholds from the tech spec §15
// (docs/practices/engineering-practices.md → Performance budget). Run: `pnpm --filter web lighthouse`
// after `pnpm build`. The planner page joins the list with Phase 11.
//
// After the performance pass (P9.11, 2026-10-11): first-screen JS (`node scripts/js-weight.mjs`) is 240 KB gzip on
// a tool page (was 330), 158 KB on a text page (was 208); React + Next alone are ≈ 136 KB. Simulated LCP follows
// the JS bytes requested before the first paint: 2.1–2.6 s on text pages, ≈ 3.5 s on a tool page (observed LCP is
// ≈ 0.1 s locally). Performance, LCP and JS weight stay warnings until the owner settles the budget (open question
// 12 in the development plan); SEO, accessibility, CLS, fonts and third parties pass and fail the build.
const KB = 1024;

module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm exec next start -p 3400",
      startServerReadyPattern: "Ready",
      url: ["http://localhost:3400/", "http://localhost:3400/pol/laminat/", "http://localhost:3400/steny/oboi/"],
      numberOfRuns: 3,
      settings: { chromeFlags: "--no-sandbox --headless=new" },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9, aggregationMethod: "median-run" }],
        "categories:seo": ["error", { minScore: 1, aggregationMethod: "median-run" }],
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2000, aggregationMethod: "median-run" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05, aggregationMethod: "median-run" }],
        "total-blocking-time": ["warn", { maxNumericValue: 200, aggregationMethod: "median-run" }],
        "resource-summary:script:size": ["warn", { maxNumericValue: 150 * KB }],
        "resource-summary:stylesheet:size": ["error", { maxNumericValue: 15 * KB }],
        "resource-summary:font:count": ["error", { maxNumericValue: 2 }],
        "resource-summary:third-party:count": ["error", { maxNumericValue: 0 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
