import { activeCategories, type CategoryDef, home, type MethodIcon, popularTools } from "@umnyaut/catalog";
import { Button, categoryIcons, IconCircle, Mascot } from "@umnyaut/ui";
import { ArrowRight, Calculator, CalendarCheck, Check, type LucideIcon, Package } from "lucide-react";
import Link from "next/link";
import { ToolCard } from "@/entities/tool";
import { mascotImages } from "@/shared/config";
import { ld } from "@/shared/lib";
import { JsonLd } from "@/shared/ui";
import { HomeRoom, initialExample } from "@/widgets/home-room";

const CATEGORIES_ID = "categories";
const methodIcons: Record<MethodIcon, LucideIcon> = { package: Package, formula: Calculator, date: CalendarCheck };

/** Home page (design spec §13 «Главная»); header and footer come from the root layout. */
export function HomePage() {
  const popular = popularTools();

  return (
    <main className="flex flex-1 flex-col">
      <JsonLd data={[ld.organization(), ld.website()]} />
      <HomeRoom hero={<Hero />} categoriesId={CATEGORIES_ID} initialCards={initialExample()} />

      <section aria-labelledby={CATEGORIES_ID} className="mx-auto w-full max-w-[1200px] px-4 pt-10 sm:px-6 lg:px-8">
        <h2 id={CATEGORIES_ID} tabIndex={-1} className="scroll-mt-24 text-h2 outline-none">
          {home.categories.title}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {activeCategories().map((category) => (
            <li key={category.slug}>
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-popular" className="mx-auto w-full max-w-[1200px] px-4 pt-10 sm:px-6 lg:px-8">
        <h2 id="home-popular" className="text-h2">
          {home.popular.title}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map(({ tool, note }) => (
            <li key={tool.id}>
              <ToolCard tool={tool} note={note} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-method" className="mx-auto w-full max-w-[1200px] px-4 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-surface-mint p-5 sm:p-8">
          <h2 id="home-method" className="text-h2">
            {home.method.title}
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-3">
            {home.method.points.map((point) => {
              const Icon = methodIcons[point.icon];
              return (
                <li key={point.icon} className="flex gap-3 sm:flex-col">
                  <IconCircle className="bg-surface">
                    <Icon />
                  </IconCircle>
                  <span className="flex flex-col">
                    <span className="text-body-strong">{point.title}</span>
                    <span className="text-small text-text-muted">{point.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <Button asChild variant="secondary" className="mt-6">
            <Link href="/metodika/">
              {home.method.link}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function Hero() {
  return (
    <div>
      <p className="inline-flex rounded-full bg-primary-soft px-3 py-1.5 font-semibold text-caption text-primary-hover uppercase tracking-wide">
        {home.badge}
      </p>
      <h1 className="mt-4 text-display">
        {home.titleLead} <span className="text-primary">{home.titleAccent}</span>
      </h1>
      <p className="mt-4 max-w-[34rem] text-base text-text-muted leading-6 lg:text-lg lg:leading-7">{home.lead}</p>
      <figure className="mt-5 flex items-center gap-3">
        <Mascot image={mascotImages.hello} size={140} sizeLg={200} alt={home.mascotAlt} spot priority />
        <figcaption className="relative max-w-[15rem] rounded-xl border border-border bg-surface px-3 py-2 font-semibold text-small shadow-md lg:text-body">
          {home.bubble}
          <span
            aria-hidden="true"
            className="absolute top-1/2 -left-[7px] size-3 -translate-y-1/2 rotate-45 border-border border-b border-l bg-surface"
          />
        </figcaption>
      </figure>
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {home.badges.map((badge) => (
          <li key={badge} className="flex items-center gap-1.5 font-medium text-small">
            <Check aria-hidden="true" className="size-4 text-primary" strokeWidth={3} />
            {badge}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryCard({ category }: { category: CategoryDef }) {
  const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] ?? Calculator;
  return (
    <Link
      href={`/${category.slug}/`}
      className="group relative flex h-full min-h-40 flex-col overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-input"
    >
      <span className="text-body-strong text-text group-hover:text-primary-hover">{category.title}</span>
      {category.note ? <span className="mt-0.5 pr-2 text-small text-text-muted">{category.note}</span> : null}
      <span
        aria-hidden="true"
        className="mt-auto inline-flex size-10 items-center justify-center rounded-full border border-border text-primary"
      >
        <ArrowRight className="size-5" />
      </span>
      <span
        aria-hidden="true"
        className="absolute -right-3 -bottom-4 flex size-20 items-center justify-center sm:size-24 rounded-[46%_54%_48%_52%/52%_46%_54%_48%] bg-primary-soft pr-2 pb-3 text-primary-hover"
      >
        <Icon className="size-8 sm:size-9" />
      </span>
    </Link>
  );
}
