import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export interface Crumb {
  href: string;
  label: string;
}

/** Phone: one back link «← Пол» to the parent; from 1024 px the full chain. The current page is not a link. */
export function Breadcrumbs({ trail, current, label }: { trail: readonly Crumb[]; current: string; label: string }) {
  const parent = trail.at(-1);
  return (
    <nav aria-label={label} className="text-small print:hidden">
      {parent ? (
        <Link
          href={parent.href}
          className="-mb-2 inline-flex min-h-12 items-center gap-1 font-semibold text-primary hover:text-primary-hover lg:hidden"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {parent.label}
        </Link>
      ) : null}
      <ol className="hidden min-h-12 flex-wrap items-center gap-1 text-text-muted lg:flex">
        {trail.map((crumb) => (
          <li key={crumb.href} className="after:mx-1 after:content-['/']">
            <Link href={crumb.href} className="text-primary hover:text-primary-hover">
              {crumb.label}
            </Link>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
