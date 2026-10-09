import "server-only";
import type { Norm } from "@umnyaut/catalog";
import { formatNumber, NBSP } from "@umnyaut/ui/format";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const NORM = /\{\{\s*norm\.([a-z0-9-]+(?:\.[a-z0-9-]+)*)\s*\}\}/gi;

/**
 * Replaces `{{norm.underlay.overlap}}` with «200 мм» from the catalog, so text never contradicts code.
 * An unknown norm throws: a page must not ship with a placeholder or a stale number.
 */
export function substituteNorms(text: string, norms: Readonly<Record<string, Norm>>): string {
  return text.replace(NORM, (_, id: string) => {
    const norm = norms[id];
    if (!norm) throw new Error(`unknown norm "${id}"`);
    return `${formatNumber(norm.value)}${NBSP}${norm.unit}`;
  });
}

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify);

/** Markdown → sanitised HTML (raw HTML in Markdown is dropped by remark-rehype, then rehype-sanitize strips the rest). */
export function renderMarkdown(markdown: string): string {
  return String(processor.processSync(markdown));
}
