import { shell, type ToolDef } from "@umnyaut/catalog";
import { Disclosure } from "@umnyaut/ui";
import { ReportError } from "@/features/report-error";
import { track } from "@/shared/analytics";
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
  /** Norm sources of the tool, from the server: the norms register stays out of the browser bundle. */
  sources?: readonly string[];
}

/** Closed `<details>`: numbered steps with the user's numbers, norm sources, checked date, report link. */
export function HowCalculated({ tool, steps, checkedAt, sources = [] }: HowCalculatedProps) {
  return (
    <Disclosure
      title={h.title}
      onOpen={() => track("how_opened", { tool: tool.id })}
      className="rounded-lg border border-border bg-surface px-4"
    >
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-body text-text tabular-nums wrap-break-word">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {/* Sources end in long URLs: without breaking anywhere they widen the phone page. */}
      <div className="mt-4 flex flex-col gap-1 text-caption text-text-muted wrap-anywhere">
        {sources.length > 0 ? (
          <p>
            {h.sources}: {sources.join("; ")}
          </p>
        ) : (
          <p>{h.geometry}</p>
        )}
        {checkedAt ? <p>{fill(h.checked, { date: dateFormat.format(new Date(`${checkedAt}T00:00:00Z`)) })}</p> : null}
        <div>
          <ReportError />
        </div>
      </div>
    </Disclosure>
  );
}
