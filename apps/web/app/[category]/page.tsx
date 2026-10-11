import { loadCategoryContent } from "@server/content";
import { activeCategories, getCategory } from "@umnyaut/catalog";
import { notFound } from "next/navigation";
import { CategoryPage, type CategoryText, categoryMetadata } from "@/views/category";

export const dynamicParams = false;

export function generateStaticParams() {
  return activeCategories().map((category) => ({ category: category.slug }));
}

async function load({ params }: PageProps<"/[category]">) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  const content = loadCategoryContent(category.slug);
  const text: CategoryText | undefined = content && { ...content.frontmatter, html: content.html, faq: content.faq };
  return { category, text };
}

export async function generateMetadata(props: PageProps<"/[category]">) {
  const { category, text } = await load(props);
  return categoryMetadata(category, text);
}

export default async function Page(props: PageProps<"/[category]">) {
  const { category, text } = await load(props);
  return <CategoryPage category={category} text={text} />;
}
