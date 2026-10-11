import { shell } from "@umnyaut/catalog";
import { Mascot } from "@umnyaut/ui";
import type { ReactNode } from "react";
import { mascotImages } from "@/shared/config";
import { fill } from "@/shared/lib";
import { Breadcrumbs } from "@/shared/ui";
import type { InfoText } from "../model/content";

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export interface InfoPageProps {
  text: InfoText;
  /** Only «О проекте» shows the cat (design spec §13). */
  mascot?: boolean;
  /** Data blocks after the text (the norm table of «Методика»). */
  children?: ReactNode;
}

/** Text column 680 px for Методика, О проекте, Политика, Контакты, Партнёрам. */
export function InfoPage({ text, mascot, children }: InfoPageProps) {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        label={shell.breadcrumbs.label}
        trail={[{ href: "/", label: shell.breadcrumbs.home }]}
        current={text.h1}
      />
      <div className="flex max-w-[680px] items-center gap-4">
        <h1 className="min-w-0 flex-1 text-h1">{text.h1}</h1>
        {mascot ? <Mascot image={mascotImages.hello} size={96} sizeLg={140} alt={shell.info.mascotAlt} spot /> : null}
      </div>
      <p className="mt-1 text-small text-text-muted">
        {fill(shell.info.updated, { date: dateFormat.format(new Date(`${text.updatedAt}T00:00:00Z`)) })}
      </p>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: built from our Markdown and sanitised by rehype-sanitize */}
      <article className="prose-umnyaut mt-6 max-w-[680px]" dangerouslySetInnerHTML={{ __html: text.html }} />
      {children}
    </main>
  );
}
