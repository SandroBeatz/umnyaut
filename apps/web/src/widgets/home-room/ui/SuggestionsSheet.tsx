"use client";

import { home, shell, toolPath } from "@umnyaut/catalog";
import { Button, categoryIcons, ResponsiveSheet } from "@umnyaut/ui";
import { ArrowRight, Calculator, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type ReactNode, type RefObject, useRef } from "react";
import { useEstimateStore } from "@/entities/estimate";
import { fill } from "@/shared/lib";
import { type SavedRoomRef, suggestedTools } from "../model/rooms";

const t = home.room;

export interface SuggestionsSheetProps {
  /** The room just saved; nothing opens without one. */
  saved: SavedRoomRef | null;
  open: boolean;
  onOpenChange(open: boolean): void;
  /** The button that opens it («Посчитать материалы»); none when the room editor opens it after a save. */
  trigger?: ReactNode;
  /** Without a trigger: what gets the focus back on close. */
  returnFocus?: RefObject<HTMLElement | null>;
  /** «Все расчёты»: runs once the popup has closed, so the returned focus does not scroll the page back. */
  onAll(): void;
}

/**
 * «Что считаем: Зал» (`docs/ui/home-room-block.md`): the room type's usual calculators — each makes the room active
 * and opens the tool with its sizes — and «Все расчёты».
 */
export function SuggestionsSheet({ saved, open, onOpenChange, trigger, returnFocus, onAll }: SuggestionsSheetProps) {
  const toAll = useRef(false);
  return (
    <ResponsiveSheet
      open={open && saved !== null}
      onOpenChange={onOpenChange}
      title={saved ? fill(t.next, { room: saved.name }) : t.action}
      description={t.nextNote}
      closeLabel={shell.close}
      trigger={trigger}
      {...(returnFocus ? { returnFocus } : {})}
      onClosed={() => {
        if (!toAll.current) return undefined;
        toAll.current = false;
        onAll();
        return true;
      }}
    >
      {saved ? (
        <div className="flex flex-col pt-1">
          <ul>
            {suggestedTools(saved.type).map((tool) => {
              const Icon = categoryIcons[tool.category as keyof typeof categoryIcons] ?? Calculator;
              return (
                <li key={tool.id} className="border-border border-t first:border-t-0">
                  <Link
                    href={toolPath(tool)}
                    onClick={() => useEstimateStore.getState().setActiveRoom(saved.id)}
                    aria-label={fill(t.open, { tool: tool.title.toLowerCase(), room: saved.name })}
                    className="group flex min-h-16 items-center gap-3 py-2 text-text"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface-mint text-primary-hover [&_svg]:size-6"
                    >
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1 text-body-strong group-hover:text-primary-hover">{tool.title}</span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-primary" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Button
            variant="ghost"
            className="mt-1 self-start px-3"
            onClick={() => {
              toAll.current = true;
              onOpenChange(false);
            }}
          >
            {t.all}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </ResponsiveSheet>
  );
}
