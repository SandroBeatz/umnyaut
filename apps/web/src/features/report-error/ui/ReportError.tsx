"use client";

import { shell } from "@umnyaut/catalog";
import { Button, Sheet, SheetContent, SheetTrigger } from "@umnyaut/ui";
import { useId } from "react";

const t = shell.reportError;

/** Stub until Phase 7 adds `/api/report`: the sheet opens, sending is not wired yet. */
export function ReportError() {
  const id = useId();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-12 items-center text-primary underline-offset-4 hover:underline"
        >
          {shell.howCalculated.report}
        </button>
      </SheetTrigger>
      <SheetContent title={t.title} description={t.description}>
        <label htmlFor={id} className="mt-2 block text-small font-medium text-text">
          {t.label}
        </label>
        <textarea
          id={id}
          rows={4}
          placeholder={t.placeholder}
          className="mt-1.5 w-full rounded-md border border-border-input bg-surface p-3 text-body text-text placeholder:text-text-subtle"
        />
        <p className="mt-2 text-small text-text-muted">{t.soon}</p>
        <Button size="lg" className="mt-4 w-full" disabled>
          {t.send}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
