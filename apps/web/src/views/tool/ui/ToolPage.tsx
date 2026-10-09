import { strings, type ToolDef } from "@umnyaut/catalog";
import type { ToolText } from "../model/content";

export function ToolPage({ tool, text }: { tool: ToolDef; text?: ToolText }) {
  return (
    <main>
      <h1>{text?.h1 ?? tool.title}</h1>
      {text && <p>{text.question}</p>}
      {tool.status === "draft" && <p>{strings.draftNotice}</p>}
      {text && (
        <article>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: built from our Markdown and sanitised by rehype-sanitize */}
          <div dangerouslySetInnerHTML={{ __html: text.html }} />
          {text.faq.map(({ q, a }) => (
            <section key={q}>
              <h2>{q}</h2>
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised like the body */}
              <div dangerouslySetInnerHTML={{ __html: a }} />
            </section>
          ))}
        </article>
      )}
    </main>
  );
}
