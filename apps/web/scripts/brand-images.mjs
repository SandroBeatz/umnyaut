#!/usr/bin/env node
// App icons and the shared social image (content plan G08, G09; plan P9.5).
//   pnpm --filter web brand-images → public/{apple-touch-icon,icon-192,icon-512,og}.png
// Outputs are committed and change only with the brand; the OG text uses a system font with Cyrillic (Arial).
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const brand = join(root, "packages/ui/assets/brand");
const out = join(root, "apps/web/public");
const MINT = "#edf9f8";
const NAVY = "#0f1e34";
const OG_LINE = "Одна комната — весь список покупок";
const OG_SUB = "Калькуляторы ремонта в пачках, рулонах и мешках";

/** Icon centred on a square background; `scale` is the icon's share of the side (maskable safe zone ≤ 0.8). */
async function icon(size, scale, file) {
  const svg = await readFile(join(brand, "icon.svg"));
  const inner = Math.round(size * scale);
  const glyph = await sharp(svg, { density: 600 })
    .resize(inner, inner, { fit: "contain", background: "#0000" })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: MINT } })
    .composite([{ input: glyph, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(join(out, file));
}

async function og() {
  const [W, H] = [1200, 630];
  const logo = await sharp(await readFile(join(brand, "logo.svg")), { density: 600 })
    .resize({ height: 84 })
    .toBuffer();
  const cat = await sharp(join(root, "docs/details/Cheerful Cat Mascot with Blueprint.png"))
    .resize({ height: 520 })
    .toBuffer();
  const text = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="80" y="330" font-family="Arial" font-weight="700" font-size="54" fill="${NAVY}">
      <tspan x="80">Одна комната —</tspan><tspan x="80" dy="66">весь список покупок</tspan>
    </text>
    <text x="80" y="480" font-family="Arial" font-size="30" fill="#4a5b70">${OG_SUB}</text>
  </svg>`);
  await sharp({ create: { width: W, height: H, channels: 4, background: MINT } })
    .composite([
      { input: logo, left: 80, top: 80 },
      { input: text, left: 0, top: 0 },
      { input: cat, left: W - 470, top: H - 540 },
    ])
    .png({ compressionLevel: 9, palette: true })
    .toFile(join(out, "og.png"));
}

await icon(180, 0.7, "apple-touch-icon.png");
await icon(192, 0.6, "icon-192.png");
await icon(512, 0.6, "icon-512.png");
await og();
console.log(`brand images → public/ (${OG_LINE})`);
