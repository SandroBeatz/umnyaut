"use client";

import { countries, shell } from "@umnyaut/catalog";
import { cn, Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@umnyaut/ui";
import { Check, ChevronDown } from "lucide-react";
import { setCountry, useCountry } from "@/entities/country";

export interface CountryPickerProps {
  /** `onDark` for the navy footer. */
  tone?: "default" | "onDark";
  className?: string;
}

/** Chip «RU · ₽» with the four countries. The choice is stored in the browser only. */
export function CountryPicker({ tone = "default", className }: CountryPickerProps) {
  const current = useCountry();
  const country = countries.find((c) => c.code === current) ?? countries[0];
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`${shell.header.country}: ${country.title}`}
        className={cn(
          "inline-flex h-12 items-center gap-1 rounded-full px-3 text-small font-semibold transition-colors",
          tone === "onDark" ? "text-white hover:bg-white/10" : "text-text hover:bg-surface-sunken",
          className,
        )}
      >
        <span className="tabular-nums">
          {country.code} · {country.sign}
        </span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={shell.country.title}>
        <p className="px-3 pt-1 pb-2 text-caption text-text-muted">{shell.country.description}</p>
        <ul>
          {countries.map((c) => (
            <li key={c.code}>
              <PopoverClose
                className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-body text-text hover:bg-surface-sunken"
                onClick={() => setCountry(c.code)}
                aria-current={c.code === current ? "true" : undefined}
              >
                <span className="flex-1">{c.title}</span>
                <span className="text-text-muted">{c.sign}</span>
                <Check aria-hidden="true" className={cn("size-5 text-primary", c.code !== current && "invisible")} />
              </PopoverClose>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
