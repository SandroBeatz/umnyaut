import { type ToolDef, toolPath } from "@umnyaut/catalog";
import { categoryIcons, IconCircle } from "@umnyaut/ui";
import { ArrowRight, Calculator } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export interface ToolCardProps {
  tool: ToolDef;
  /** Second line; defaults to what the tool gives («Площадь пола и периметр»). */
  note?: ReactNode;
}

/** Whole card is one link: icon, title, one line, arrow (design spec §11 «Карточка инструмента»). */
export function ToolCard({ tool, note }: ToolCardProps) {
  const Icon = categoryIcons[tool.category as keyof typeof categoryIcons] ?? Calculator;
  return (
    <Link
      href={toolPath(tool)}
      className="group flex min-h-20 items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-input"
    >
      <IconCircle>
        <Icon />
      </IconCircle>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-strong text-text group-hover:text-primary-hover">{tool.title}</span>
        {(note ?? tool.outcome) ? <span className="text-small text-text-muted">{note ?? tool.outcome}</span> : null}
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-primary" />
    </Link>
  );
}
