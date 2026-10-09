#!/usr/bin/env node
// Image pipeline (design system: mascot and material photos; plan P3.7, P3.9).
//   pnpm --filter web images        → rebuild public/img/{mascot,m} + src/shared/config/{mascot,materials}.gen.ts
//   pnpm --filter web images:check  → CI: sources unchanged since the last build, files exist, weight budgets hold
// Outputs are committed: encoders differ slightly between platforms, so CI checks inputs and budgets, not bytes.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const web = join(root, "apps/web");
const ENCODER = { avif: { quality: 50, effort: 6 }, webp: { quality: 80, alphaQuality: 85, effort: 6 } };
const ALPHA_FLOOR = 24; // alpha below this is generation noise around the character
const MATERIAL_MARGIN = 0.06; // transparent margin on each side of a squared material photo

/**
 * Stage-1 poses: source, rendered CSS widths (1× and 2× are built), budget per AVIF file in KB.
 * AVIF is what browsers download; WebP is the fallback for old ones and may weigh up to 2× the budget.
 */
const POSES = {
  hello: { source: "Cheerful Cat Mascot with Blueprint.png", widths: [160, 400], budgetKb: 60 },
  done: { source: "Winking Cat Mascot with Calculator and Thumbs-Up.png", widths: [56, 96], budgetKb: 10 },
  warn: { source: "Friendly Orange Tabby Mascot with Raised Paw.png", widths: [56, 96], budgetKb: 10, avifQuality: 45 },
  oops: { source: "Apologetic Tabby Cat Shrugging.png", widths: [160, 240], budgetKb: 40 },
  head: { source: "Cute Orange Tabby Cat Avatar.png", widths: [40], budgetKb: 4 },
};

/** Material photos (content plan: photo brief), keyed by `PurchaseItem.key`; thumbs render at 64 and 96 px. */
const MATERIALS = {
  laminate: { source: "laminate.png", widths: [64, 96], budgetKb: 5 },
  wallpaper: { source: "wallpaper.png", widths: [64, 96], budgetKb: 5 },
  "tile-adhesive": { source: "tile-adhesive.png", widths: [64, 96], budgetKb: 5 },
};

const GROUPS = [
  { name: "mascotImages", file: "mascot.gen.ts", sources: "docs/details", out: "mascot", items: POSES },
  {
    name: "materialImages",
    file: "materials.gen.ts",
    sources: "docs/details/materials",
    out: "m",
    items: MATERIALS,
    square: true,
  },
];

const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");
const configHash = sha(Buffer.from(JSON.stringify({ GROUPS, ENCODER, ALPHA_FLOOR, MATERIAL_MARGIN }))).slice(0, 12);
const outDir = (group) => join(web, "public/img", group.out);
const manifestPath = (group) => join(web, "src/shared/config", group.file);

/** Clears faint alpha and crops to the visible object; `square` pads it to a square with an even margin. */
async function prepare(input, square) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [left, top, right, bottom] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = (y * info.width + x) * 4 + 3;
      if (data[a] < ALPHA_FLOOR) {
        data[a] = 0;
        continue;
      }
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  const width = right - left + 1;
  const height = bottom - top + 1;
  const cropped = sharp(data, { raw: info }).extract({ left, top, width, height });
  if (!square) return { png: await cropped.png().toBuffer(), width, height };
  const side = Math.round(Math.max(width, height) / (1 - 2 * MATERIAL_MARGIN));
  const x = Math.floor((side - width) / 2);
  const y = Math.floor((side - height) / 2);
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const png = await cropped
    .extend({ left: x, right: side - width - x, top: y, bottom: side - height - y, background: transparent })
    .png()
    .toBuffer();
  return { png, width: side, height: side };
}

async function buildGroup(group) {
  const dir = outDir(group);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const manifest = {};
  for (const [key, { source, widths, avifQuality }] of Object.entries(group.items)) {
    const input = await readFile(join(root, group.sources, source));
    const { png, width, height } = await prepare(input, group.square);
    const sizes = [...new Set(widths.flatMap((w) => [w, w * 2]))].sort((a, b) => a - b);
    const entry = { width, height, sourceSha: sha(input).slice(0, 16), avif: [], webp: [] };
    for (const w of sizes) {
      for (const format of ["avif", "webp"]) {
        const options = format === "avif" && avifQuality ? { ...ENCODER.avif, quality: avifQuality } : ENCODER[format];
        const file = await sharp(png).resize({ width: w })[format](options).toBuffer();
        const name = `${key}-${w}.${sha(file).slice(0, 8)}.${format}`;
        await writeFile(join(dir, name), file);
        entry[format].push({ w, src: `/img/${group.out}/${name}` });
      }
    }
    manifest[key] = entry;
    console.log(`${key}: ${width}×${height} → ${sizes.join(", ")}`);
  }
  const body = `// Generated by apps/web/scripts/images.mjs (config ${configHash}). Do not edit.\nexport const ${group.name} = ${JSON.stringify(manifest, null, 2)} as const;\n`;
  await writeFile(manifestPath(group), body);
  console.log(`wrote ${relative(root, manifestPath(group))}`);
}

async function checkGroup(group, errors) {
  const text = await readFile(manifestPath(group), "utf8").catch(() => "");
  if (!text.includes(`(config ${configHash})`))
    errors.push(`${group.file}: pipeline config changed — run \`pnpm --filter web images\``);
  const manifest = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1) || "{}");
  const listed = new Set();
  for (const [key, { source, budgetKb }] of Object.entries(group.items)) {
    const entry = manifest[key];
    if (!entry) {
      errors.push(`${key}: missing from manifest`);
      continue;
    }
    const input = await readFile(join(root, group.sources, source));
    if (sha(input).slice(0, 16) !== entry.sourceSha) errors.push(`${key}: source changed — rebuild images`);
    for (const [format, limitKb] of [
      ["avif", budgetKb],
      ["webp", budgetKb * 2],
    ]) {
      for (const { src } of entry[format]) {
        listed.add(src.split("/").pop());
        const size = await stat(join(web, "public", src)).then(
          (s) => s.size,
          () => -1,
        );
        if (size < 0) errors.push(`${src}: file missing`);
        else if (size > limitKb * 1024) errors.push(`${src}: ${(size / 1024).toFixed(1)} KB > ${limitKb} KB budget`);
      }
    }
  }
  for (const name of await readdir(outDir(group)).catch(() => [])) {
    if (!listed.has(name)) errors.push(`public/img/${group.out}/${name}: not in manifest`);
  }
}

async function build() {
  for (const group of GROUPS) await buildGroup(group);
}

async function check() {
  const errors = [];
  for (const group of GROUPS) await checkGroup(group, errors);
  if (errors.length) {
    console.error(`Image check failed:\n${errors.map((e) => `  ✗ ${e}`).join("\n")}`);
    process.exit(1);
  }
  console.log("Image check passed.");
}

await (process.argv.includes("--check") ? check() : build());
