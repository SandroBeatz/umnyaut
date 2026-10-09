import { activeCategories, navigation, shell, site } from "@umnyaut/catalog";
import { Logo } from "@umnyaut/ui";
import Link from "next/link";
import { CountryPicker } from "@/features/pick-country";

/**
 * Navy footer (design spec §11): white logo, categories, info pages, country. «Настройки cookie» and the bot link
 * arrive with the cookie banner (Phase 8) and the bot (Phase 9).
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-navy text-white print:hidden">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-3">
          <Logo tone="white" className="self-start" />
          <p className="text-small text-white/75">{shell.footer.note}</p>
        </div>
        <nav aria-label={shell.footer.categories}>
          <h2 className="text-small font-semibold text-white/75">{shell.footer.categories}</h2>
          <ul className="mt-2">
            {activeCategories().map((category) => (
              <li key={category.slug}>
                <Link href={`/${category.slug}/`} className="flex min-h-12 items-center text-body hover:underline">
                  {category.title}
                </Link>
              </li>
            ))}
            {navigation.infoPages.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="flex min-h-12 items-center text-body hover:underline">
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-small font-semibold text-white/75">{shell.footer.country}</h2>
          <CountryPicker tone="onDark" className="-ml-3 mt-1" />
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-4 pb-8 text-caption text-white/75 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} {site.name}
      </div>
    </footer>
  );
}
