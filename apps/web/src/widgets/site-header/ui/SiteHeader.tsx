import { activeCategories, shell, toolPath, toolsIn } from "@umnyaut/catalog";
import { categoryIcons, Logo, Mascot, Popover, PopoverContent, PopoverTrigger } from "@umnyaut/ui";
import { ChevronDown, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { CountryPicker } from "@/features/pick-country";
import { mascotImages } from "@/shared/config";
import { MenuSheet } from "./MenuSheet";

const iconOf = (slug: string) => categoryIcons[slug as keyof typeof categoryIcons] ?? LayoutGrid;

/**
 * Sticky header (design spec §11): phone 56 px — logo, country chip, menu sheet; from 1024 px 72 px — mascot head
 * and logo, «Калькуляторы» panel, country. Planner and «Мои расчёты» join when their routes exist.
 */
export function SiteHeader() {
  const groups = activeCategories().map((category) => ({ category, tools: toolsIn(category.slug) }));
  return (
    <header className="sticky top-0 z-[var(--z-header)] border-border border-b bg-bg print:hidden">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 sm:px-6 lg:h-[72px] lg:gap-6 lg:px-8">
        <Link href="/" aria-label={shell.header.home} className="flex items-center gap-2">
          <Mascot image={mascotImages.head} size={40} alt="" className="hidden lg:inline-block" />
          <Logo label="" />
        </Link>
        <nav aria-label={shell.header.calculators} className="hidden lg:block">
          <Popover>
            <PopoverTrigger className="inline-flex h-12 items-center gap-1 rounded-md px-3 text-body-strong text-text hover:bg-surface-sunken">
              {shell.header.calculators}
              <ChevronDown aria-hidden="true" className="size-4" />
            </PopoverTrigger>
            <PopoverContent className="grid w-[min(720px,90vw)] grid-cols-3 gap-4 p-4">
              {groups.map(({ category, tools }) => {
                const Icon = iconOf(category.slug);
                return (
                  <div key={category.slug}>
                    <Link
                      href={`/${category.slug}/`}
                      className="flex min-h-12 items-center gap-2 text-body-strong text-text hover:text-primary-hover"
                    >
                      <Icon aria-hidden="true" className="size-5 text-primary-hover" />
                      {category.title}
                    </Link>
                    <ul>
                      {tools.map((tool) => (
                        <li key={tool.id}>
                          <Link
                            href={toolPath(tool)}
                            className="flex min-h-10 items-center text-small text-text-muted hover:text-primary-hover"
                          >
                            {tool.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </PopoverContent>
          </Popover>
        </nav>
        <div className="ml-auto flex items-center">
          <CountryPicker />
          <MenuSheet groups={groups} />
        </div>
      </div>
    </header>
  );
}
