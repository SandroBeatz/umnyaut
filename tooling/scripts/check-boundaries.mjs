#!/usr/bin/env node
// Import-boundary guard (AGENTS.md hard rules 2–3). Runs in `pnpm check` and before `next build`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = /\.(ts|tsx|mts|js|mjs|jsx)$/;
const SKIP = new Set(["node_modules", ".next", ".turbo", "coverage", "dist"]);
const errors = [];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    if (SKIP.has(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : SOURCE.test(name) ? [path] : [];
  });
}

const rel = (path) => relative(root, path).split(sep).join("/");
const IMPORT =
  /(?:^|[\s;])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|[\s;])import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function importsOf(text) {
  return [...stripComments(text).matchAll(IMPORT)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4]);
}

function check(files, rule) {
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const message of rule(file, text, importsOf(text))) errors.push(`${rel(file)}: ${message}`);
  }
}

const isRelative = (spec) => spec.startsWith("./") || spec.startsWith("../");
const isTest = (file) => /\.test\.tsx?$/.test(file);
const pkg = (name) => join(root, "packages", name, "src");
const web = join(root, "apps/web");

// packages/calc: zod + relative only; no clock, randomness or network.
check(walk(pkg("calc")), (file, text, imports) => [
  ...imports
    .filter((s) => !isRelative(s) && s !== "zod" && !(isTest(file) && ["vitest", "fast-check"].includes(s)))
    .map((s) => `calc may import only zod, got "${s}"`),
  ...[
    [/\bDate\.now\s*\(/, "Date.now()"],
    [/\bnew Date\s*\(\s*\)/, "new Date()"],
    [/\bMath\.random\s*\(/, "Math.random()"],
    [/\bfetch\s*\(/, "fetch()"],
  ]
    .filter(([re]) => re.test(stripComments(text)))
    .map(([, name]) => `calc must stay pure, found ${name}`),
]);

// packages/catalog: calc + zod + relative.
check(walk(pkg("catalog")), (file, _text, imports) =>
  imports
    .filter((s) => !isRelative(s) && !["zod", "@umnyaut/calc"].includes(s) && !(isTest(file) && s === "vitest"))
    .map((s) => `catalog may import only @umnyaut/calc and zod, got "${s}"`),
);

// packages/ui and packages/db: nothing from the project.
for (const name of ["ui", "db"]) {
  check(walk(pkg(name)), (_file, _text, imports) =>
    imports.filter((s) => s.startsWith("@umnyaut/")).map((s) => `${name} must not import project packages, got "${s}"`),
  );
}

// apps/web/server: `import "server-only"` first.
check(walk(join(web, "server")), (_file, text) =>
  /^\s*import\s+["']server-only["'];?/.test(stripComments(text)) ? [] : ['must start with import "server-only"'],
);

// apps/web/src: never server/ or @umnyaut/db.
const serverDir = join(web, "server");
check(walk(join(web, "src")), (file, _text, imports) =>
  imports
    .filter(
      (s) =>
        s === "@umnyaut/db" ||
        s.startsWith("@umnyaut/db/") ||
        s.startsWith("@server/") ||
        (isRelative(s) && `${resolve(dirname(file), s)}${sep}`.startsWith(`${serverDir}${sep}`)),
    )
    .map((s) => `src must not import server code, got "${s}"`),
);

// apps/web/src FSD layer order. Steiger 0.7 hardcodes layer names and skips `views` (our pages layer).
const srcDir = join(web, "src");
const LAYERS = ["shared", "entities", "features", "widgets", "views"];
function locate(path) {
  const parts = relative(srcDir, path).split(sep);
  const rank = LAYERS.indexOf(parts[0]);
  return rank === -1 || parts[0] === ".." ? null : { layer: parts[0], rank, slice: parts[1] };
}
check(walk(srcDir), (file, _text, imports) => {
  const from = locate(file);
  if (!from) return [];
  return imports.flatMap((s) => {
    const target = s.startsWith("@/") ? join(srcDir, s.slice(2)) : isRelative(s) ? resolve(dirname(file), s) : null;
    const to = target && locate(target);
    if (!to) return [];
    if (to.rank > from.rank) return [`${from.layer} must not import from higher layer ${to.layer} ("${s}")`];
    if (to.rank === from.rank && from.layer !== "shared" && to.slice !== from.slice) {
      return [`slices of ${from.layer} must not import each other ("${s}")`];
    }
    return [];
  });
});

// packages/calc/package.json: zod is the only runtime dependency.
const calcDeps = Object.keys(
  JSON.parse(readFileSync(join(root, "packages/calc/package.json"), "utf8")).dependencies ?? {},
);
for (const dep of calcDeps.filter((d) => d !== "zod")) {
  errors.push(`packages/calc/package.json: runtime dependency "${dep}" is not allowed (zod only)`);
}

if (errors.length > 0) {
  console.error(`Boundary check failed (${errors.length}):\n${errors.map((e) => `  ✗ ${e}`).join("\n")}`);
  process.exit(1);
}
console.log("Boundary check passed.");
