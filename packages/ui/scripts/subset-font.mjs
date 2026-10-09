#!/usr/bin/env node
// Builds assets/fonts/onest-var.woff2 (design system: typography). Run: pnpm --filter @umnyaut/ui font
// Source: full Onest variable TTF from google/fonts at a pinned commit (fontsource ships it split by unicode range).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const SOURCE =
  "https://raw.githubusercontent.com/google/fonts/4c1db3aec83c67dd223dd82a68c039cab30917a9/ofl/onest/Onest%5Bwght%5D.ttf";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "../assets/fonts/onest-var.woff2");

const range = (from, to) => String.fromCodePoint(...Array.from({ length: to - from + 1 }, (_, i) => from + i));
const text = [
  range(0x20, 0x7e), // basic Latin
  range(0x410, 0x44f), // А–я
  "Ёё",
  "₽₸×²³≈→−—–«»№°·…“”„‘’",
  "   ", // nbsp, thin space, narrow nbsp (Intl thousands separator)
].join("");

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`download failed: ${response.status}`);
const font = Buffer.from(await response.arrayBuffer());
const woff2 = await subsetFont(font, text, { targetFormat: "woff2" });
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, woff2);
console.log(`onest-var.woff2: ${(woff2.length / 1024).toFixed(1)} KB, ${[...text].length} code points`);
