"use client";

import { shell } from "@umnyaut/catalog";
import { Button, toast } from "@umnyaut/ui";
import { Copy, Printer, Send } from "lucide-react";
import type { ReactNode } from "react";
import { fill } from "@/shared/lib";

const t = shell.actions;

export interface ResultActionsProps {
  /** Page title for the share sheet. */
  title: string;
  /** Called on click so the text and link reflect the current input. */
  getText(): string;
  getUrl(): string;
  /** Replaces the disabled «Сохранить» (purchase tools put «В список» here). */
  primary?: ReactNode;
  /** For analytics: what was done (`link` — share sheet or copied link, `copy` — the text copied). */
  onAction?(action: "link" | "copy" | "print"): void;
}

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast.error(t.copyFailed);
  }
}

/**
 * «Сохранить» (disabled until projects exist, Phase 7), «Отправить» (system share sheet, or the link is copied),
 * «Скопировать» (the text only, no link — owner, 2026-10-14), «Печать». No request to the server.
 */
export function ResultActions({ title, getText, getUrl, primary, onAction }: ResultActionsProps) {
  const send = async () => {
    const url = getUrl();
    onAction?.("link");
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: fill(shell.share.title, { tool: title }), text: getText(), url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    await copy(url, t.linkCopied);
  };

  const iconButton =
    "flex h-12 flex-col items-center justify-center gap-0.5 rounded-md px-3 text-caption text-primary transition-colors hover:bg-primary-soft hover:text-primary-hover [&_svg]:size-5";

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {primary ?? (
        <Button className="min-w-32 flex-1" disabled title={t.saveSoon}>
          {t.save}
        </Button>
      )}
      <button type="button" className={iconButton} onClick={send}>
        <Send aria-hidden="true" />
        {t.share}
      </button>
      <button
        type="button"
        className={iconButton}
        onClick={() => {
          onAction?.("copy");
          void copy(getText(), t.copied);
        }}
      >
        <Copy aria-hidden="true" />
        {t.copy}
      </button>
      <button
        type="button"
        className={iconButton}
        onClick={() => {
          onAction?.("print");
          window.print();
        }}
      >
        <Printer aria-hidden="true" />
        {t.print}
      </button>
    </div>
  );
}
