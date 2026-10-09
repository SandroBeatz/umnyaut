import "server-only";
import { z } from "zod";

/** Length limits from design spec §18 / docs/ui/calculator-shell-and-pages.md. Overflow is a build warning, not an error. */
export const LIMITS = { title: 65, description: 160, h1: 40, question: 42 } as const;

/** YAML turns an unquoted 2026-11-20 into a Date; both forms become "2026-11-20". */
const date = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date().transform((d) => d.toISOString().slice(0, 10))])
  .pipe(z.string());

const text = z.string().trim().min(1);

/**
 * Frontmatter of `content/tools/<id>.md`. The worked example and ≥ 3 FAQ are required (business spec:
 * every page and variation has its own example and questions); without them the build fails.
 */
export const frontmatterSchema = z.object({
  title: text,
  description: text,
  h1: text,
  question: text,
  updatedAt: date,
  checkedAt: date,
  /** Input of the worked example — fields that differ from the tool's defaults. */
  example: z
    .record(z.string(), z.unknown())
    .refine((v) => Object.keys(v).length > 0, "example must set at least one field"),
  faq: z.array(z.object({ q: text, a: text })).min(3, "at least 3 FAQ entries"),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/** Fields longer than their limit, as readable warnings. */
export function lengthWarnings(frontmatter: Frontmatter): string[] {
  return (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).flatMap((key) => {
    const length = [...frontmatter[key]].length;
    return length > LIMITS[key] ? [`${key} is ${length} characters, limit ${LIMITS[key]}`] : [];
  });
}
