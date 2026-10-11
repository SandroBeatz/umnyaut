import { cn } from "@umnyaut/ui";

export interface PageTextProps {
  /** Sanitised HTML of the Markdown body (rendered at build time on the server). */
  html: string;
  faq: readonly { q: string; a: string }[];
  /** «Вопросы и ответы» from catalog. */
  faqTitle: string;
  className?: string;
}

/** Text under a tool or category: Markdown body, then the questions with sanitised HTML answers. */
export function PageText({ html, faq, faqTitle, className }: PageTextProps) {
  return (
    <article className={cn("prose-umnyaut max-w-[44rem]", className)}>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: built from our Markdown and sanitised by rehype-sanitize */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <section aria-labelledby="faq" className="mt-8">
        <h2 id="faq" className="text-h2">
          {faqTitle}
        </h2>
        <div className="mt-2 divide-y divide-border border-border border-y">
          {faq.map(({ q, a }) => (
            <section key={q} className="py-4">
              <h3 className="text-body-strong">{q}</h3>
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised like the body */}
              <div className="mt-1 text-body text-text-muted" dangerouslySetInnerHTML={{ __html: a }} />
            </section>
          ))}
        </div>
      </section>
    </article>
  );
}
