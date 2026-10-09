"use client";

import { type ChangeEvent, type ClipboardEvent, type ReactNode, useEffect, useId, useState } from "react";
import { cn } from "../lib/cn";
import { displayDecimal, parseDecimal, sanitiseTyping } from "./number-input";

export interface NumberFieldProps {
  label: ReactNode;
  value: number | null;
  /** Called with a parsed number (or `null` when empty) on every valid keystroke. */
  onValueChange: (value: number | null) => void;
  /** Unit suffix inside the field: «м», «см», «шт». */
  unit?: ReactNode;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  /** Error texts come from catalog: «От 0,5 до 30 м», «Введите длину». */
  messages?: { range?: string; required?: string; invalid?: string };
  required?: boolean;
  hint?: ReactNode;
  /** Server/parent error, shown regardless of blur state. */
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

function validate(
  value: number | null,
  { min, max, required, messages }: Pick<NumberFieldProps, "min" | "max" | "required" | "messages">,
): string | undefined {
  if (value === null) return required ? messages?.required : undefined;
  if (Number.isNaN(value)) return messages?.invalid ?? messages?.range;
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) return messages?.range;
  return undefined;
}

/**
 * Decimal input for dimensions and counts: decimal keyboard, comma or dot, validation on blur only
 * (never while typing), 18 px value, 48 px tall.
 */
export function NumberField({
  label,
  value,
  onValueChange,
  unit,
  min,
  max,
  allowNegative = false,
  messages,
  required,
  hint,
  error,
  placeholder,
  disabled,
  name,
  id,
  className,
}: NumberFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [text, setText] = useState(() => displayDecimal(value));
  const [blurError, setBlurError] = useState<string>();

  // Follow outside changes (preset chips, «My room») without clobbering what the user is typing.
  useEffect(() => {
    setText((current) => (parseDecimal(current) === value ? current : displayDecimal(value)));
  }, [value]);

  const commit = (next: string) => {
    setText(next);
    const parsed = parseDecimal(next);
    if (parsed === null || !Number.isNaN(parsed)) {
      if (parsed !== value) onValueChange(parsed);
    }
    if (blurError) setBlurError(undefined);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => commit(sanitiseTyping(event.target.value, allowNegative));

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = parseDecimal(event.clipboardData.getData("text"));
    if (pasted === null || Number.isNaN(pasted)) return;
    event.preventDefault();
    commit(displayDecimal(allowNegative ? pasted : Math.abs(pasted)));
  };

  const onBlur = () => {
    const parsed = parseDecimal(text);
    if (parsed !== null && !Number.isNaN(parsed)) setText(displayDecimal(parsed));
    setBlurError(validate(parsed, { min, max, required, messages }));
  };

  const shownError = error ?? blurError;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const unitId = `${inputId}-unit`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-small font-medium text-text">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center rounded-md border bg-surface transition-colors focus-within:outline-2 focus-within:outline-focus focus-within:outline-offset-2",
          shownError ? "border-danger" : "border-border-input",
          disabled && "opacity-50",
        )}
      >
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={
            [unit ? unitId : null, shownError ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
            undefined
          }
          onChange={onChange}
          onPaste={onPaste}
          onBlur={onBlur}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-input text-text tabular-nums outline-none placeholder:text-text-subtle"
        />
        {unit ? (
          <span id={unitId} className="pr-3 text-body text-text-subtle">
            {unit}
          </span>
        ) : null}
      </div>
      {shownError ? (
        <p id={errorId} className="text-small text-danger">
          {shownError}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-small text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
