import { type CategoryDef, shell, toolsIn } from "@umnyaut/catalog";
import { ToolCard } from "@/entities/tool";
import { RoomBar } from "@/features/edit-room";
import { Breadcrumbs } from "@/shared/ui";

/** Skeleton (P5.7): back link, H1, “My room”, tool cards. Work order, text and FAQ come in Phase 8. */
export function CategoryPage({ category }: { category: CategoryDef }) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        label={shell.breadcrumbs.label}
        trail={[{ href: "/", label: shell.breadcrumbs.home }]}
        current={category.title}
      />
      <h1 className="text-h1">{category.title}</h1>
      <div className="mt-4 lg:max-w-[33rem]">
        <RoomBar />
      </div>
      <h2 className="mt-8 text-h3">{shell.category.tools}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {toolsIn(category.slug).map((tool) => (
          <li key={tool.id}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </main>
  );
}
