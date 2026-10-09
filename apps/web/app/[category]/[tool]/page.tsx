import { getTool, tools } from "@umnyaut/catalog";
import { notFound } from "next/navigation";
import { ToolPage, toolMetadata } from "@/views/tool";

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ category: tool.category, tool: tool.id }));
}

async function load({ params }: PageProps<"/[category]/[tool]">) {
  const { category, tool } = await params;
  const def = getTool(category, tool);
  if (!def) notFound();
  return def;
}

export async function generateMetadata(props: PageProps<"/[category]/[tool]">) {
  return toolMetadata(await load(props));
}

export default async function Page(props: PageProps<"/[category]/[tool]">) {
  return <ToolPage tool={await load(props)} />;
}
