import { getCategory, shell, strings, type ToolDef } from "@umnyaut/catalog";
import { Breadcrumbs } from "@/shared/ui";
import { CalculatorShell } from "@/widgets/calculator-shell";
import type { ToolText } from "../model/content";

/**
 * Tool page order (docs/ui/calculator-shell-and-pages.md): back link, H1 + question, the shell (room, form,
 * result, actions, next steps, how calculated), then the text and FAQ from Markdown.
 */
export function ToolPage({ tool, text }: { tool: ToolDef; text?: ToolText }) {
  const category = getCategory(tool.category);
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-8 sm:px-6 lg:px-8">
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
      <CalculatorShell category={tool.category} toolId={tool.id} checkedAt={text?.checkedAt} />
      {text ? (
        <article className="prose-umnyaut mt-10 max-w-[44rem] print:hidden">
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: built from our Markdown and sanitised by rehype-sanitize */}
          <div dangerouslySetInnerHTML={{ __html: text.html }} />
          <section aria-labelledby="faq" className="mt-8">
            <h2 id="faq" className="text-h2">
              {shell.faq}
            </h2>
            <div className="mt-2 divide-y divide-border border-border border-y">
              {text.faq.map(({ q, a }) => (
                <section key={q} className="py-4">
                  <h3 className="text-body-strong">{q}</h3>
                  {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised like the body */}
                  <div className="mt-1 text-body text-text-muted" dangerouslySetInnerHTML={{ __html: a }} />
                </section>
              ))}
            </div>
          </section>
        </article>
      ) : null}
    </main>
  );
}
