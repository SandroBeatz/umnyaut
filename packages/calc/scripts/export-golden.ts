// Reviewer export (plan P4.5, tech spec §5): golden examples → a Markdown or CSV table a master reads without code.
//   pnpm calc:export                       → Markdown to stdout, every tool with a formula
//   pnpm calc:export --csv --out r.csv laminat oboi
import { writeFileSync } from "node:fs";
import { type GoldenExample, type GoldenFile, runExample } from "../src/golden";
import { toolModules } from "../src/tools";
import type { ToolModule, ToolResult } from "../src/types";

export interface ExportRow {
  tool: string;
  version: number;
  example: string;
  input: string;
  expected: string;
  result: string;
  source: string;
  benchmark: string;
}

const fmt = (n: number) => String(Math.round(n * 1000) / 1000).replace(".", ",");

/** Only fields that differ from the defaults, as `name=value` — the scenario in the reviewer's terms. */
function describeInput<I>(tool: ToolModule<I>, example: GoldenExample<I>): string {
  const defaults = tool.defaults({ country: "RU", ...example.ctx }) as Record<string, unknown>;
  return Object.entries(example.input as Record<string, unknown>)
    .filter(([key, value]) => JSON.stringify(defaults[key]) !== JSON.stringify(value))
    .map(([key, value]) => `${key}=${typeof value === "number" ? fmt(value) : JSON.stringify(value)}`)
    .join("; ");
}

function describeResult(result: ToolResult): string {
  return result.items
    .map((i) => `${i.key}: ${i.packs} × ${fmt(i.pack.size.value)} ${i.pack.size.unit} (need ${fmt(i.need.value)})`)
    .join("; ");
}

export function exportRows<I>(tool: ToolModule<I>, golden: GoldenFile<I>): ExportRow[] {
  return golden.examples.map((example) => {
    const benchmarks = (golden.benchmarks ?? []).filter((b) => b.example === example.name);
    return {
      tool: tool.id,
      version: tool.version,
      example: example.name,
      input: describeInput(tool, example) || "defaults",
      expected: JSON.stringify(example.expected),
      result: describeResult(runExample(tool, example)),
      source: `${example.source.kind}: ${example.source.ref}`,
      benchmark: benchmarks
        .map((b) => `${b.site} ${JSON.stringify(b.observed)}${b.explanation ? ` — ${b.explanation}` : ""}`)
        .join("; "),
    };
  });
}

const COLUMNS: (keyof ExportRow)[] = [
  "tool",
  "version",
  "example",
  "input",
  "expected",
  "result",
  "source",
  "benchmark",
];

export function toMarkdown(rows: readonly ExportRow[]): string {
  const cell = (v: unknown) => String(v).replaceAll("|", "\\|").replaceAll("\n", " ");
  return [
    `| ${COLUMNS.join(" | ")} |`,
    `|${COLUMNS.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${COLUMNS.map((c) => cell(row[c])).join(" | ")} |`),
  ].join("\n");
}

export function toCsv(rows: readonly ExportRow[]): string {
  const cell = (v: unknown) => `"${String(v).replaceAll('"', '""')}"`;
  return [COLUMNS.join(","), ...rows.map((row) => COLUMNS.map((c) => cell(row[c])).join(","))].join("\n");
}

async function main(args: string[]) {
  const csv = args.includes("--csv");
  const outAt = args.indexOf("--out");
  const out = outAt >= 0 ? args[outAt + 1] : undefined;
  const ids = args.filter((a, i) => !a.startsWith("--") && i !== outAt + 1);
  const rows: ExportRow[] = [];
  for (const [id, tool] of Object.entries(toolModules) as [string, ToolModule<unknown>][]) {
    if (tool.version === 0 || (ids.length && !ids.includes(id))) continue;
    const { golden } = (await import(`../src/tools/${id}/golden`)) as { golden: GoldenFile<unknown> };
    rows.push(...exportRows(tool, golden));
  }
  if (!rows.length) {
    console.error("No golden examples to export (no tool with a formula yet).");
    return;
  }
  const text = `${csv ? toCsv(rows) : toMarkdown(rows)}\n`;
  if (out) writeFileSync(out, text);
  else process.stdout.write(text);
}

if (import.meta.url === `file://${process.argv[1]}`) await main(process.argv.slice(2));
