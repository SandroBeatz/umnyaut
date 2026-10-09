"use client";

import { type CategoryDef, shell, type ToolDef, toolPath } from "@umnyaut/catalog";
import { Button, categoryIcons, Sheet, SheetClose, SheetContent, SheetTrigger } from "@umnyaut/ui";
import { LayoutGrid, Menu } from "lucide-react";
import Link from "next/link";

export interface MenuSheetProps {
  groups: readonly { category: CategoryDef; tools: readonly ToolDef[] }[];
}

/** Phone menu (< 1024 px): categories with icons and their tools. */
export function MenuSheet({ groups }: MenuSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={shell.header.menu} className="text-text lg:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent title={shell.header.menuTitle}>
        <nav aria-label={shell.header.calculators}>
          <ul className="flex flex-col gap-4">
            {groups.map(({ category, tools }) => {
              const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] ?? LayoutGrid;
              return (
                <li key={category.slug}>
                  <SheetClose asChild>
                    <Link href={`/${category.slug}/`} className="flex min-h-12 items-center gap-3 text-body-strong">
                      <Icon aria-hidden="true" className="size-6 text-primary-hover" />
                      {category.title}
                    </Link>
                  </SheetClose>
                  <ul className="ml-9">
                    {tools.map((tool) => (
                      <li key={tool.id}>
                        <SheetClose asChild>
                          <Link href={toolPath(tool)} className="flex min-h-12 items-center text-body text-text-muted">
                            {tool.title}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
