#!/usr/bin/env node
// First-screen JS budget (plan P9.11, open question 12): for every prerendered page, the scripts its HTML loads,
// gzip -9, `noModule` polyfills skipped (modern browsers never fetch them). Link prefetches made later are not
// counted. Reads the build output — run after `pnpm build`; exits 1 when a page is over its budget.
//   node scripts/js-weight.mjs            one line per page type (its largest page)
//   VERBOSE=1 node scripts/js-weight.mjs  every page
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";

const web = join(import.meta.dirname, "..");
const app = join(web, ".next/server/app");
const SKIP = /^(_not-found|_global-error)\.html$/;
const TEXT = new Set(["/metodika/", "/o-proekte/", "/politika/", "/kontakty/", "/partneram/"]);

/**
 * KB gzip per page type, decided by the owner on 2026-10-11 (development plan, open question 12); the estimate page
 * (P17.11) added with its measured size and some room. Calculator modules it loads on demand are not counted.
 */
const BUDGET_KB = { text: 165, category: 195, home: 220, tool: 250, estimate: 230 };

const kindOf = (route) =>
  route === "/"
    ? "home"
    : route === "/spisok/"
      ? "estimate"
      : TEXT.has(route)
        ? "text"
        : route.split("/").length > 3
          ? "tool"
          : "category";

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name.endsWith(".html") && !SKIP.test(name) ? [path] : [];
  });
}

const gz = new Map();
function sizeOf(file) {
  if (!gz.has(file)) gz.set(file, gzipSync(readFileSync(join(web, ".next/static/chunks", file)), { level: 9 }).length);
  return gz.get(file);
}

let files;
try {
  files = pages(app);
} catch {
  console.error("No build found: run `pnpm --filter web build` first.");
  process.exit(1);
}

const results = files.map((file) => {
  const path = relative(app, file)
    .split(sep)
    .filter((part) => !part.startsWith("("))
    .join("/")
    .replace(/(index)?\.html$/, "");
  const route = path ? `/${path}/` : "/";
  const html = readFileSync(file, "utf8");
  const legacy = new Set(
    (html.match(/<script[^>]*noModule[^>]*>/gi) ?? []).map((tag) => tag.match(/src="([^"?]+)/)?.[1]),
  );
  const scripts = [...new Set(html.match(/\/_next\/static\/chunks\/[^"'\s]+\.js/g) ?? [])]
    .filter((src) => !legacy.has(src))
    .map((src) => src.split("/chunks/")[1] ?? "");
  const kb = scripts.reduce((sum, f) => sum + sizeOf(f), 0) / 1024;
  return { route, kind: kindOf(route), kb };
});

let over = 0;
for (const [kind, budget] of Object.entries(BUDGET_KB)) {
  const group = results.filter((r) => r.kind === kind).sort((a, b) => b.kb - a.kb);
  const worst = group[0];
  if (!worst) continue;
  const ok = worst.kb <= budget;
  if (!ok) over++;
  console.log(
    `${ok ? "✓" : "✗"} ${kind.padEnd(8)} ${worst.kb.toFixed(1).padStart(6)} KB gzip (budget ${budget}), largest ${worst.route}, ${group.length} pages`,
  );
  if (process.env.VERBOSE) for (const r of group) console.log(`    ${r.kb.toFixed(1).padStart(6)}  ${r.route}`);
}
if (over > 0) {
  console.error(`JS budget exceeded on ${over} page type(s).`);
  process.exit(1);
}
