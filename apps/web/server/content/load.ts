import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { norms as catalogNorms, type Norm } from "@umnyaut/catalog";
import matter from "gray-matter";
import { renderMarkdown, substituteNorms } from "./render";
import { type Frontmatter, frontmatterSchema, lengthWarnings } from "./schema";

export interface ToolContent {
  frontmatter: Frontmatter;
  /** Sanitised HTML of the body, norms substituted. */
  html: string;
  /** FAQ with norms substituted; answers rendered as HTML. */
  faq: { q: string; a: string }[];
  warnings: string[];
}

export const TOOL_CONTENT_DIR = join(process.cwd(), "content/tools");

/** Parses one Markdown file's source. Throws with the file name on schema errors or unknown norms. */
export function parseToolContent(
  source: string,
  file: string,
  norms: Readonly<Record<string, Norm>> = catalogNorms,
): ToolContent {
  const { data, content } = matter(source);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "frontmatter"}: ${i.message}`).join("; ");
    throw new Error(`${file}: ${issues}`);
  }
  try {
    const sub = (text: string) => substituteNorms(text, norms);
    const frontmatter = { ...parsed.data, title: sub(parsed.data.title), description: sub(parsed.data.description) };
    return {
      frontmatter,
      html: renderMarkdown(sub(content)),
      faq: frontmatter.faq.map(({ q, a }) => ({ q: sub(q), a: renderMarkdown(sub(a)) })),
      warnings: lengthWarnings(frontmatter).map((w) => `${file}: ${w}`),
    };
  } catch (error) {
    throw new Error(`${file}: ${(error as Error).message}`);
  }
}

const cache = new Map<string, ToolContent | undefined>();

/**
 * Content of `content/tools/<id>.md`, or undefined while a tool has none (drafts). Runs at build time
 * (static pages); length overflow is printed as a build warning once per file.
 */
export function loadToolContent(id: string, dir = TOOL_CONTENT_DIR): ToolContent | undefined {
  const file = join(dir, `${id}.md`);
  if (cache.has(file)) return cache.get(file);
  const content = existsSync(file) ? parseToolContent(readFileSync(file, "utf8"), `content/tools/${id}.md`) : undefined;
  for (const warning of content?.warnings ?? []) console.warn(`⚠ ${warning}`);
  cache.set(file, content);
  return content;
}
