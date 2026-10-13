"use client";

import { shell } from "@umnyaut/catalog";
import { useId } from "react";

const t = shell.calcs;

/** «Метка» of the open calc: «белая глянцевая» in the chips, the estimate and print. */
export function CalcLabel({ value, onChange }: { value: string; onChange(label: string): void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-text">
        {t.label}
      </label>
      <input
        id={id}
        type="text"
        maxLength={40}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`${id}-hint`}
        className="h-12 rounded-md border border-border-input bg-surface px-3 text-input text-text outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
      />
      <p id={`${id}-hint`} className="text-small text-text-muted">
        {t.labelHint}
      </p>
    </div>
  );
}
