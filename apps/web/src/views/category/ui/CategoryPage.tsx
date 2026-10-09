import { type CategoryDef, toolPath, toolsIn } from "@umnyaut/catalog";
import Link from "next/link";

export function CategoryPage({ category }: { category: CategoryDef }) {
  return (
    <main>
      <h1>{category.title}</h1>
      <ul>
        {toolsIn(category.slug).map((tool) => (
          <li key={tool.id}>
            <Link href={toolPath(tool)}>{tool.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
