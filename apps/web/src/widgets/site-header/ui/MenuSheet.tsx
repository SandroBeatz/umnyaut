"use client";

import { type CategoryDef, shell, type ToolDef, toolPath } from "@umnyaut/catalog";
import { Button, categoryIcons, ResponsiveSheet } from "@umnyaut/ui";
import { LayoutGrid, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface MenuSheetProps {
  groups: readonly { category: CategoryDef; tools: readonly ToolDef[] }[];
}

/** Phone menu (< 1024 px): categories with icons and their tools. */
export function MenuSheet({ groups }: MenuSheetProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={setOpen}
      title={shell.header.menuTitle}
      closeLabel={shell.close}
      trigger={
        <Button variant="ghost" size="icon" aria-label={shell.header.menu} className="text-text lg:hidden">
          <Menu />
        </Button>
      }
    >
      <nav aria-label={shell.header.calculators}>
        <ul className="flex flex-col gap-4">
          {groups.map(({ category, tools }) => {
            const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] ?? LayoutGrid;
            return (
              <li key={category.slug}>
                <Link
                  href={`/${category.slug}/`}
                  onClick={close}
                  className="flex min-h-12 items-center gap-3 text-body-strong"
                >
                  <Icon aria-hidden="true" className="size-6 text-primary-hover" />
                  {category.title}
                </Link>
                <ul className="ml-9">
                  {tools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={toolPath(tool)}
                        onClick={close}
                        className="flex min-h-12 items-center text-body text-text-muted"
                      >
                        {tool.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <Link
          href="/metodika/"
          onClick={close}
          className="mt-4 flex min-h-12 items-center border-border border-t pt-2 text-body-strong"
        >
          {shell.header.methodology}
        </Link>
      </nav>
    </ResponsiveSheet>
  );
}
