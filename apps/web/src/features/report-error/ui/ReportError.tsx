"use client";

import { shell } from "@umnyaut/catalog";
import { Button, ResponsiveSheet, toast } from "@umnyaut/ui";
import { type FormEvent, useId, useState } from "react";
import { callApi } from "@/shared/lib";

const t = shell.reportError;

export interface ReportErrorProps {
  tool: string;
  toolVersion: number;
  /** What the user entered; goes with the message so the calc can be replayed (`POST /api/reports/`). */
  input: Record<string, unknown>;
}

/** «Сообщить об ошибке»: the message with the tool, its formula version and the input. */
export function ReportError({ tool, toolVersion, input }: ReportErrorProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const website = new FormData(event.currentTarget).get("website");
    setSending(true);
    const result = await callApi("/api/reports/", {
      method: "POST",
      body: {
        tool,
        toolVersion,
        input,
        message,
        pageUrl: window.location.pathname,
        ...(typeof website === "string" && website ? { website } : {}),
      },
    });
    setSending(false);
    if (result.ok) {
      toast(t.sent);
      setMessage("");
      setOpen(false);
    } else {
      toast.error(result.code === "rate_limited" ? t.tooMany : t.failed);
    }
  };

  return (
    <ResponsiveSheet
      title={t.title}
      description={t.description}
      closeLabel={shell.close}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className="inline-flex min-h-12 items-center text-primary underline-offset-4 hover:underline"
        >
          {shell.howCalculated.report}
        </button>
      }
    >
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor={id} className="mt-2 block text-small font-medium text-text">
          {t.label}
        </label>
        <textarea
          id={id}
          rows={4}
          required
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t.placeholder}
          className="mt-1.5 w-full rounded-md border border-border-input bg-surface p-3 text-body text-text placeholder:text-text-subtle"
        />
        {/* Honeypot: off-screen and out of the tab order; a filled one is accepted and dropped by the server. */}
        <label className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          {t.honeypot}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={sending || message.trim() === ""}>
          {t.send}
        </Button>
      </form>
    </ResponsiveSheet>
  );
}
