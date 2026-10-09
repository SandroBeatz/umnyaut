import { getNorm, shell, type ToolDef } from "@umnyaut/catalog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@umnyaut/ui";
import { ReportError } from "@/features/report-error";
import { fill } from "@/shared/lib";

const h = shell.howCalculated;
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export interface HowCalculatedProps {
  tool: ToolDef;
  steps: readonly string[];
  /** YYYY-MM-DD from the content frontmatter. */
  checkedAt?: string;
}

/** Closed accordion: numbered steps with the user's numbers, norm sources, checked date, report link. */
export function HowCalculated({ tool, steps, checkedAt }: HowCalculatedProps) {
  const sources = (tool.norms ?? []).flatMap((id) => getNorm(id)?.source ?? []);
  return (
    <Accordion type="single" collapsible className="rounded-lg border border-border bg-surface px-4">
      <AccordionItem value="how">
        <AccordionTrigger>{h.title}</AccordionTrigger>
        <AccordionContent>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-body text-text tabular-nums">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="mt-4 flex flex-col gap-1 text-caption text-text-muted">
            {sources.length > 0 ? (
              <p>
                {h.sources}: {[...new Set(sources)].join("; ")}
              </p>
            ) : (
              <p>{h.geometry}</p>
            )}
            {checkedAt ? (
              <p>{fill(h.checked, { date: dateFormat.format(new Date(`${checkedAt}T00:00:00Z`)) })}</p>
            ) : null}
            <div>
              <ReportError />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
