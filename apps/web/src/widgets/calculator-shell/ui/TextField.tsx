import type { ReactNode } from "react";
import { useId } from "react";

export interface TextFieldProps {
  name: string;
  label: ReactNode;
  hint?: string | undefined;
  maxLength: number;
  value: string;
  onChange(text: string): void;
}

/** A short name the user types, half a row like the number fields (the grout's own colour). */
export function TextField({ name, label, hint, maxLength, value, onChange }: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        maxLength={maxLength}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...(hint ? { "aria-describedby": `${id}-hint` } : {})}
        className="h-12 rounded-md border border-border-input bg-surface px-3 text-input text-text outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-small text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
