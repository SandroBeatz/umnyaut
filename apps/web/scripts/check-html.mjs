#!/usr/bin/env node
// Server-HTML guard (plan P5.10): every prerendered page works without JavaScript — a title, exactly one H1,
// a canonical link; tool pages (/<category>/<tool>/) also carry the result numbers. Run after `next build`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = join(import.meta.dirname, "../.next/server/app");
const SKIP = /^(_not-found|_global-error)\.html$/;

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name.endsWith(".html") && !SKIP.test(name) ? [path] : [];
  });
}

let files;
try {
  files = pages(root);
} catch {
  console.error("No build found: run `pnpm --filter web build` first.");
  process.exit(1);
}

const errors = [];
for (const file of files) {
  const route = `/${relative(root, file)
    .split(sep)
    .join("/")
    .replace(/(index)?\.html$/, "")}`;
  const html = readFileSync(file, "utf8");
  const fail = (message) => errors.push(`${route}: ${message}`);

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  if (!title) fail("no <title>");
  const h1 = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1 !== 1) fail(`${h1} <h1> elements, expected 1`);
  if (!/<link rel="canonical" href="[^"]+"/.test(html)) fail("no canonical link");

  if (route.split("/").filter(Boolean).length === 2) {
    const numbers = [...html.matchAll(/data-result-value="true"[^>]*>([^<]*)</g)].map((m) => m[1]);
    if (numbers.length === 0) fail("no result numbers in the server HTML");
    for (const n of numbers) if (!/\d/.test(n)) fail(`result "${n}" has no digits`);
  }
}

if (errors.length) {
  console.error(`Server-HTML check failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}
console.log(`Server-HTML check passed: ${files.length} pages.`);
