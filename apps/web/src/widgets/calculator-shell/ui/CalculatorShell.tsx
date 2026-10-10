"use client";

import { getTool, unitLabels } from "@umnyaut/catalog";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCountry } from "@/entities/country";
import { roomDimensions, useRoomStore } from "@/entities/room";
import { RoomBar } from "@/features/edit-room";
import { AddToList, RoomList } from "@/features/room-list";
import { ResultActions, shareUrl } from "@/features/share-result";
import { AdSlot } from "@/shared/ui";
import { useCalculator } from "../model/useCalculator";
import { describeResult, resultText } from "../model/view";
import { HowCalculated } from "./HowCalculated";
import { NextSteps } from "./NextSteps";
import { PrintSheet } from "./PrintSheet";
import { ResultPanel } from "./ResultPanel";
import { StickyResultBar } from "./StickyResultBar";
import { ToolForm } from "./ToolForm";

export interface CalculatorShellProps {
  category: string;
  toolId: string;
  /** YYYY-MM-DD from the content file, for «Проверено …». */
  checkedAt?: string;
}

/**
 * The one component that renders every tool (docs/ui/calculator-shell-and-pages.md). Phone: room, form, result
 * in one column with a sticky result bar; from 1024 px form 5/12 left, result 7/12 right and sticky.
 */
export function CalculatorShell({ category, toolId, checkedAt }: CalculatorShellProps) {
  const tool = getTool(category, toolId);
  if (!tool) throw new Error(`Unknown tool ${category}/${toolId}`);
  const calc = useCalculator(tool);
  const country = useCountry();
  const room = useRoomStore((s) => s.room);
  const view = describeResult(tool, calc.result, country);

  const panel = useRef<HTMLElement>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  useEffect(() => {
    const node = panel.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setPanelVisible(entry?.isIntersecting ?? true));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { values, defaults } = calc;
  const getUrl = useCallback(() => shareUrl(window.location.href, values, defaults), [values, defaults]);
  const getText = () => resultText(tool, view);

  return (
    <>
      <div className="flex flex-col gap-6 print:hidden">
        <div className="grid gap-3 lg:grid-cols-12 lg:items-start lg:gap-6">
          <div className="flex flex-col gap-3 lg:col-span-5">
            <RoomBar />
            <ToolForm
              tool={tool}
              values={values}
              defaults={defaults}
              onChange={calc.setValues}
              onInvalid={calc.setInvalid}
            />
          </div>
          <div className="flex flex-col gap-4 lg:sticky lg:top-[88px] lg:col-span-7">
            <ResultPanel ref={panel} tool={tool} view={view} example={calc.example} stale={calc.stale} />
            <ResultActions
              title={tool.title}
              getText={getText}
              getUrl={getUrl}
              primary={
                view.mode === "buy" ? (
                  <AddToList tool={tool} values={values} defaults={defaults} className="min-w-32 flex-1" />
                ) : undefined
              }
            />
            <AdSlot placement="after-result" />
          </div>
        </div>
        <RoomList />
        <NextSteps tool={tool} />
        <HowCalculated tool={tool} steps={view.steps} checkedAt={checkedAt} />
      </div>
      <PrintSheet
        tool={tool}
        view={view}
        items={calc.result.items}
        room={roomDimensions(room, unitLabels.m)}
        getUrl={getUrl}
      />
      <StickyResultBar text={view.short} visible={!panelVisible} />
    </>
  );
}
