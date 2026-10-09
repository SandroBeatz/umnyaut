import { loadToolContent } from "@server/content";
import { getTool, tools } from "@umnyaut/catalog";
import { notFound } from "next/navigation";
import { ToolPage, type ToolText, toolMetadata } from "@/views/tool";

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ category: tool.category, tool: tool.id }));
}

async function load({ params }: PageProps<"/[category]/[tool]">) {
  const { category, tool } = await params;
  const def = getTool(category, tool);
  if (!def) notFound();
  const content = loadToolContent(def.id);
  const text: ToolText | undefined = content && { ...content.frontmatter, html: content.html, faq: content.faq };
  return { def, text };
}

export async function generateMetadata(props: PageProps<"/[category]/[tool]">) {
  const { def, text } = await load(props);
  return toolMetadata(def, text);
}

export default async function Page(props: PageProps<"/[category]/[tool]">) {
  const { def, text } = await load(props);
  return <ToolPage tool={def} text={text} />;
}
