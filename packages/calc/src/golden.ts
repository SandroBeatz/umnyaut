import type { CalcContext, ToolModule, ToolResult } from "./types";

/** Minimum golden examples per tool with a formula (tech spec §5). */
export const MIN_GOLDEN = 10;

/** Where the expected numbers come from. A competitor is never a source — see `BenchmarkObservation`. */
export interface GoldenSource {
  kind: "datasheet" | "norm" | "manual" | "reviewer";
  /** Datasheet/norm reference, or the hand derivation for `manual` («21,3 / 2,22 = 9,59 → 10»). */
  ref: string;
}

/**
 * Numbers per purchase item key, summed over its lines (a can set has one line per size); only the listed
 * fields are compared. `packs` is exact, the rest within tolerance.
 */
export interface ExpectedItem {
  packs?: number;
  need?: number;
  bought?: number;
  leftover?: number;
}

/** Partial expectation: anything not listed is not checked. */
export interface GoldenExpectation {
  items?: Readonly<Record<string, ExpectedItem>>;
  /** Item keys that must be absent from the result. */
  absentItems?: readonly string[];
  summary?: Readonly<Record<string, number>>;
  /** Warning codes that must be present. `[]` means: no warnings at all. */
  warnings?: readonly string[];
  costTotal?: number;
}

export interface GoldenExample<I> {
  /** Unique within the tool; used by benchmarks and the reviewer export. */
  name: string;
  /** Merged over `defaults(ctx)` before the schema parses it. */
  input: Partial<I>;
  ctx?: Partial<CalcContext>;
  expected: GoldenExpectation;
  source: GoldenSource;
  /** Relative tolerance for non-integer numbers; default 1e-6. */
  tolerance?: number;
}

/**
 * What a competitor (Qalculator first) showed for the same scenario. Kept apart from `expected` on purpose:
 * it never becomes the expected value. If it differs from `expected`, `explanation` must say why.
 */
export interface BenchmarkObservation {
  example: string;
  site: string;
  url: string;
  checkedAt: string;
  observed: GoldenExpectation;
  explanation?: string;
}

export interface GoldenFile<I> {
  tool: string;
  examples: readonly GoldenExample<I>[];
  benchmarks?: readonly BenchmarkObservation[];
}

const DEFAULT_TOLERANCE = 1e-6;

const close = (actual: number, expected: number, tolerance: number) =>
  Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected));

/** Differences between a result and a partial expectation; empty = match. */
export function matchExpectation(
  result: ToolResult,
  expected: GoldenExpectation,
  tolerance = DEFAULT_TOLERANCE,
): string[] {
  const errors: string[] = [];
  const num = (label: string, actual: number | undefined, want: number, exact = false) => {
    if (actual === undefined) errors.push(`${label}: missing, expected ${want}`);
    else if (exact ? actual !== want : !close(actual, want, tolerance))
      errors.push(`${label}: got ${actual}, expected ${want}`);
  };
  for (const [key, want] of Object.entries(expected.items ?? {})) {
    // A can set has one line per size with the same key; the expectation is about their sum.
    const lines = result.items.filter((i) => i.key === key);
    if (lines.length === 0) {
      errors.push(`item ${key}: missing`);
      continue;
    }
    const sum = (pick: (i: (typeof lines)[number]) => number) => lines.reduce((total, i) => total + pick(i), 0);
    if (want.packs !== undefined)
      num(
        `${key}.packs`,
        sum((i) => i.packs),
        want.packs,
        true,
      );
    if (want.need !== undefined)
      num(
        `${key}.need`,
        sum((i) => i.need.value),
        want.need,
      );
    if (want.bought !== undefined)
      num(
        `${key}.bought`,
        sum((i) => i.bought.value),
        want.bought,
      );
    if (want.leftover !== undefined)
      num(
        `${key}.leftover`,
        sum((i) => i.leftover.value),
        want.leftover,
      );
  }
  for (const key of expected.absentItems ?? []) {
    if (result.items.some((i) => i.key === key)) errors.push(`item ${key}: expected absent`);
  }
  for (const [key, want] of Object.entries(expected.summary ?? {})) {
    num(`summary.${key}`, result.summary.find((s) => s.key === key)?.value, want);
  }
  if (expected.warnings) {
    const codes = result.warnings.map((w) => w.code);
    if (expected.warnings.length === 0 && codes.length) errors.push(`warnings: expected none, got ${codes.join(", ")}`);
    for (const code of expected.warnings) if (!codes.includes(code)) errors.push(`warning ${code}: missing`);
  }
  if (expected.costTotal !== undefined) num("cost.total", result.cost?.total, expected.costTotal);
  return errors;
}

/** Runs one example through the tool the way the shell does: defaults → merge → schema → compute. */
export function runExample<I>(tool: ToolModule<I>, example: GoldenExample<I>): ToolResult {
  const ctx: CalcContext = { country: "RU", ...example.ctx };
  const input = tool.input.parse({ ...tool.defaults(ctx), ...example.input });
  return tool.compute(input, ctx);
}

/**
 * Every rule a golden file must satisfy: right tool, ≥ 10 examples, unique names, a source on each,
 * each example matches, each benchmark points at an example and explains any difference.
 */
export function validateGolden<I>(tool: ToolModule<I>, file: GoldenFile<I>): string[] {
  const errors: string[] = [];
  if (file.tool !== tool.id) errors.push(`golden file is for "${file.tool}", not "${tool.id}"`);
  if (file.examples.length < MIN_GOLDEN) errors.push(`${file.examples.length} examples, need at least ${MIN_GOLDEN}`);
  const names = new Set<string>();
  for (const example of file.examples) {
    const at = `"${example.name}"`;
    if (names.has(example.name)) errors.push(`${at}: duplicate name`);
    names.add(example.name);
    if (!example.source?.ref?.trim()) errors.push(`${at}: missing source`);
    let result: ToolResult;
    try {
      result = runExample(tool, example);
    } catch (error) {
      errors.push(`${at}: threw ${(error as Error).message}`);
      continue;
    }
    for (const e of matchExpectation(result, example.expected, example.tolerance)) errors.push(`${at}: ${e}`);
  }
  for (const benchmark of file.benchmarks ?? []) {
    const example = file.examples.find((e) => e.name === benchmark.example);
    const at = `benchmark ${benchmark.site} "${benchmark.example}"`;
    if (!example) {
      errors.push(`${at}: no such example`);
      continue;
    }
    const differs = matchExpectation(runExample(tool, example), benchmark.observed, example.tolerance).length > 0;
    if (differs && !benchmark.explanation?.trim()) errors.push(`${at}: differs from our result without an explanation`);
  }
  return errors;
}
