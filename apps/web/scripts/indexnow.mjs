#!/usr/bin/env node
// IndexNow after a deploy (plan P9.8): new or changed sitemap entries go to Yandex (shared with Bing, Seznam…).
//   node apps/web/scripts/indexnow.mjs <old-sitemap.xml> <prod-url>
// The key comes from <prod-url>/indexnow.txt (env INDEXNOW_KEY on the server); without it the step is skipped.
// Google learns about pages from the sitemap in Search Console instead.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const ENDPOINT = "https://yandex.com/indexnow";

/** `loc → lastmod` of a sitemap. */
export function parseSitemap(xml) {
  const entries = new Map();
  for (const [, body] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = body.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (loc) entries.set(loc, body.match(/<lastmod>(.*?)<\/lastmod>/)?.[1] ?? "");
  }
  return entries;
}

/** URLs that are new or whose lastmod changed. */
export function changedUrls(oldXml, newXml) {
  const before = parseSitemap(oldXml);
  return [...parseSitemap(newXml)].filter(([loc, lastmod]) => before.get(loc) !== lastmod).map(([loc]) => loc);
}

async function main([oldFile, prodUrl]) {
  const origin = new URL(prodUrl).origin;
  const keyResponse = await fetch(`${origin}/indexnow.txt`);
  if (!keyResponse.ok) {
    console.log("IndexNow: no key on the server, skipped");
    return;
  }
  const key = (await keyResponse.text()).trim();
  const oldXml = await readFile(oldFile, "utf8").catch(() => "");
  const newXml = await (await fetch(`${origin}/sitemap.xml`)).text();
  const urlList = changedUrls(oldXml, newXml);
  if (urlList.length === 0) {
    console.log("IndexNow: sitemap unchanged");
    return;
  }
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(origin).host, key, keyLocation: `${origin}/indexnow.txt`, urlList }),
  });
  console.log(`IndexNow: ${urlList.length} URL(s) → ${response.status}`);
  for (const url of urlList) console.log(`  ${url}`);
  if (!response.ok && response.status !== 202) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main(process.argv.slice(2));
