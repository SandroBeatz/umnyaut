"use client";

import type { Estimate } from "@umnyaut/calc";
import { estimatePage } from "@umnyaut/catalog";
import { Button, toast } from "@umnyaut/ui";
import type { Country } from "@umnyaut/ui/format";
import { Copy, Link2, Printer, Send } from "lucide-react";
import { encodeSnapshot, SNAPSHOT_MAX, SNAPSHOT_PREFIX } from "@/entities/estimate";
import { shortLink } from "@/features/estimate-link";
import { fill } from "@/shared/lib";
import type { EstimateBoard } from "../model/board";
import { estimateText } from "../model/export";
import { SHARED_ESTIMATE_PATH } from "../model/link";

const t = estimatePage.export;

export interface ExportActionsProps {
  estimate: Estimate;
  board: EstimateBoard;
  /** The currency the page shows; the link carries it, so the receiver sees the same sums. */
  country: Country;
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
 * The estimate's link: the short `/p/<id>/` when the server is there (P17.17), else the snapshot after `#` (Р14);
 * `undefined` when even that is too long for a messenger.
 */
async function linkOf(estimate: Estimate, country: Country): Promise<string | undefined> {
  const short = await shortLink({ ...estimate, country });
  if (short) return short;
  const snapshot = await encodeSnapshot({ ...estimate, country });
  if (snapshot.length > SNAPSHOT_MAX) return undefined;
  return `${window.location.origin}${SHARED_ESTIMATE_PATH}${SNAPSHOT_PREFIX}${snapshot}`;
}

const print = () => window.print();

/**
 * «Печать / PDF» (browser print, Р13), «Отправить» (share sheet with the text and the link, else both copied),
 * «Скопировать» (plain text), «Ссылка» (short link via the server, else the snapshot after `#`; too long → suggests
 * PDF). Only the link goes to the server, and only the estimate's snapshot.
 */
export function ExportActions({ estimate, board, country }: ExportActionsProps) {
  const text = () => estimateText(estimate.name, board, country);

  const send = async () => {
    const url = await linkOf(estimate, country);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: estimate.name, text: text(), ...(url ? { url } : {}) });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    await copy(url ? `${text()}\n\n${fill(t.open, { url })}` : text(), t.copied);
  };

  const share = async () => {
    const pending = linkOf(estimate, country);
    const tooLong = () => toast(t.linkTooLong, { action: { label: t.print, onClick: print } });
    // Safari lets the clipboard be written after a network call only through a ClipboardItem made in the tap itself.
    if (typeof ClipboardItem === "function" && typeof navigator.clipboard?.write === "function") {
      const blob = pending.then((url) => {
        if (!url) throw new Error("too long");
        return new Blob([url], { type: "text/plain" });
      });
      try {
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
        toast(t.linkCopied);
        return;
      } catch {
        if (!(await pending)) return tooLong();
      }
    }
    const url = await pending;
    if (url) await copy(url, t.linkCopied);
    else tooLong();
  };

  const ghost =
    "flex h-12 items-center justify-center gap-2 rounded-md px-3 text-body-strong text-primary hover:bg-primary-soft hover:text-primary-hover [&_svg]:size-5";

  return (
    <div className="grid grid-cols-2 gap-3 print:hidden" data-estimate-actions>
      <Button variant="primary" size="md" className="px-3" title={t.printLabel} onClick={print}>
        <Printer aria-hidden="true" />
        {t.print}
      </Button>
      <Button variant="secondary" size="md" className="px-3" onClick={() => void send()}>
        <Send aria-hidden="true" />
        {t.send}
      </Button>
      <button type="button" className={ghost} onClick={() => void copy(text(), t.copied)}>
        <Copy aria-hidden="true" />
        {t.copy}
      </button>
      <button type="button" className={ghost} onClick={() => void share()}>
        <Link2 aria-hidden="true" />
        {t.link}
      </button>
    </div>
  );
}
