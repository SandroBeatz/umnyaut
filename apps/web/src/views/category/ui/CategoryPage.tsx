import { type CategoryDef, shell, type ToolDef, toolPath, tools, toolsIn } from "@umnyaut/catalog";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ToolCard } from "@/entities/tool";
import { RoomBar } from "@/features/edit-room";
import { fill, ld } from "@/shared/lib";
import { Breadcrumbs, JsonLd, PageText } from "@/shared/ui";
import type { CategoryText } from "../model/content";

const t = shell.category;

/** Category page (design spec §13 «Категория»): back link, H1 + lead, “My room”, tool cards, work order, text. */
export function CategoryPage({ category, text }: { category: CategoryDef; text?: CategoryText }) {
  const steps = (category.steps ?? []).map((step) => ({
    title: step.title,
    tools: step.tools.flatMap((id) => tools.filter((tool) => tool.id === id && tool.status === "live")),
  }));

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-8 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          ld.breadcrumbs([
            { name: shell.breadcrumbs.home, path: "/" },
            { name: category.title, path: `/${category.slug}/` },
          ]),
          ...(text ? [ld.faq(text.faq)] : []),
        ]}
      />
      <Breadcrumbs
        label={shell.breadcrumbs.label}
        trail={[{ href: "/", label: shell.breadcrumbs.home }]}
        current={category.title}
      />
      <h1 className="text-h1">{text?.h1 ?? category.title}</h1>
      {text ? <p className="mt-1 max-w-[44rem] text-body text-text-muted">{text.lead}</p> : null}
      <div className="mt-4 lg:max-w-[33rem]">
        <RoomBar />
      </div>

      <h2 className="mt-8 text-h3">{t.tools}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {toolsIn(category.slug).map((tool) => (
          <li key={tool.id}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>

      {steps.length > 0 ? (
        <section aria-labelledby="work-order" className="mt-10">
          <h2 id="work-order" className="text-h2">
            {t.steps}
          </h2>
          <ol className="mt-4 grid gap-3 lg:grid-flow-col lg:auto-cols-fr">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative flex gap-3 rounded-lg border border-border bg-surface p-4 lg:flex-col"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-hover tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="sr-only">{fill(t.step, { n: String(index + 1) })}: </span>
                  <span className="text-body-strong">{step.title}</span>
                  <StepLinks tools={step.tools} />
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {text ? <PageText html={text.html} faq={text.faq} faqTitle={shell.faq} className="mt-10" /> : null}
    </main>
  );
}

/** «Ламинат или Линолеум →»: each tool of a step is its own 48 px link. */
function StepLinks({ tools: list }: { tools: readonly ToolDef[] }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      {list.map((tool, i) => (
        <span key={tool.id} className="flex items-center gap-x-2">
          {i > 0 ? <span className="text-small text-text-muted">{t.or}</span> : null}
          <Link
            href={toolPath(tool)}
            className="inline-flex min-h-12 items-center gap-1 font-semibold text-primary text-small hover:text-primary-hover hover:underline"
          >
            {tool.title}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </span>
      ))}
    </span>
  );
}
