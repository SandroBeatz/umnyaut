import { getCategory, getNorm, shell, strings, type ToolDef, toolPath, tools } from "@umnyaut/catalog";
import { ld } from "@/shared/lib";
import { Breadcrumbs, JsonLd, PageText } from "@/shared/ui";
import { ToolCalculator } from "@/widgets/calculator-shell";
import type { ToolText } from "../model/content";

/**
 * Tool page order (docs/ui/calculator-shell-and-pages.md): back link, H1 + question, the shell (room, form,
 * result, actions, next steps, how calculated), then the text and FAQ from Markdown.
 */
export function ToolPage({ tool, text }: { tool: ToolDef; text?: ToolText }) {
  const category = getCategory(tool.category);
  const path = toolPath(tool);
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-8 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          ld.tool({ name: text?.h1 ?? tool.title, description: text?.description ?? tool.outcome ?? "", path }),
          ld.breadcrumbs([
            { name: shell.breadcrumbs.home, path: "/" },
            ...(category ? [{ name: category.title, path: `/${category.slug}/` }] : []),
            { name: tool.title, path },
          ]),
          ...(text ? [ld.faq(text.faq)] : []),
        ]}
      />
      <Breadcrumbs
        label={shell.breadcrumbs.label}
        trail={[
          { href: "/", label: shell.breadcrumbs.home },
          ...(category ? [{ href: `/${category.slug}/`, label: category.title }] : []),
        ]}
        current={tool.title}
      />
      <div className="mb-3 print:hidden">
        <h1 className="text-h1">{text?.h1 ?? tool.title}</h1>
        {text ? <p className="text-body text-text-muted">{text.question}</p> : null}
        {tool.status === "draft" ? <p className="mt-2 text-small text-accent-text">{strings.draftNotice}</p> : null}
      </div>
      <ToolCalculator
        tool={tool}
        next={(tool.nextSteps ?? []).flatMap((id) => tools.find((t) => t.id === id) ?? [])}
        checkedAt={text?.checkedAt}
        // Looked up here, on the server: the norms register stays out of the browser bundle.
        sources={[...new Set((tool.norms ?? []).flatMap((id) => getNorm(id)?.source ?? []))]}
      />
      {text ? <PageText html={text.html} faq={text.faq} faqTitle={shell.faq} className="mt-10 print:hidden" /> : null}
    </main>
  );
}
