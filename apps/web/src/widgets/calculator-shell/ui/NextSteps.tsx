import { shell, type ToolDef } from "@umnyaut/catalog";
import { ToolCard } from "@/entities/tool";
import { track } from "@/shared/analytics";

/** «Дальше по ремонту»: tools that continue the work; “My room” carries the sizes over. */
export function NextSteps({ tool, next }: { tool: ToolDef; next: readonly ToolDef[] }) {
  if (next.length === 0) return null;
  return (
    <section aria-labelledby="next-steps" className="print:hidden">
      <h2 id="next-steps" className="text-h3">
        {shell.nextSteps.title}
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {next.map((t) => (
          <li key={t.id} onClickCapture={() => track("next_tool_clicked", { tool: tool.id, next: t.id })}>
            <ToolCard tool={t} note={shell.nextSteps.carried} />
          </li>
        ))}
      </ul>
    </section>
  );
}
