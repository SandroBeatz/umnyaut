#!/usr/bin/env node
// First-screen JS per page (plan P9.11): every script the page's HTML loads, gzip -9, from the build output.
// Link prefetches made later are not counted. Run against `next start` after `pnpm build`:
//   node scripts/js-weight.mjs [base-url] [paths…]      VERBOSE=1 lists the files
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const web = join(dirname(fileURLToPath(import.meta.url)), "..");
const [base = "http://localhost:3300", ...given] = process.argv.slice(2);
const paths = given.length > 0 ? given : ["/", "/pol/", "/pol/laminat/", "/steny/oboi/", "/metodika/"];

for (const path of paths) {
  const html = await (await fetch(base + path)).text();
  // `noModule` polyfills are skipped: modern browsers never download them.
  const legacy = new Set(
    (html.match(/<script[^>]*noModule[^>]*>/gi) ?? []).map((tag) => tag.match(/src="([^"?]+)/)?.[1]),
  );
  const files = [...new Set(html.match(/\/_next\/static\/chunks\/[^"'\s]+\.js/g) ?? [])].filter((f) => !legacy.has(f));
  const sizes = files.map((file) => {
    const body = readFileSync(join(web, ".next/static/chunks", file.split("/chunks/")[1] ?? ""));
    return { file: file.split("/").pop(), gz: gzipSync(body, { level: 9 }).length };
  });
  const total = sizes.reduce((sum, s) => sum + s.gz, 0);
  console.log(`${path.padEnd(16)} ${(total / 1024).toFixed(1).padStart(6)} KB gzip, ${files.length} scripts`);
  if (process.env.VERBOSE) {
    for (const s of sizes.sort((a, b) => b.gz - a.gz))
      console.log(`  ${(s.gz / 1024).toFixed(1).padStart(6)}  ${s.file}`);
  }
}
