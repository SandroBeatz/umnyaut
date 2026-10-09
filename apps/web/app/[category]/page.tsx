import { activeCategories, getCategory } from "@umnyaut/catalog";
import { notFound } from "next/navigation";
import { CategoryPage, categoryMetadata } from "@/views/category";

export const dynamicParams = false;

export function generateStaticParams() {
  return activeCategories().map((category) => ({ category: category.slug }));
}

async function load({ params }: PageProps<"/[category]">) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  return category;
}

export async function generateMetadata(props: PageProps<"/[category]">) {
  return categoryMetadata(await load(props));
}

export default async function Page(props: PageProps<"/[category]">) {
  return <CategoryPage category={await load(props)} />;
}
