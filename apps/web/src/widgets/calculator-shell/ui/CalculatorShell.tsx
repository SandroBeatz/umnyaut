"use client";

import type { BareZone, Opening, ToolModule } from "@umnyaut/calc";
import { getTool, shell, unitLabels } from "@umnyaut/catalog";
import { toast } from "@umnyaut/ui";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCountry } from "@/entities/country";
import { useActiveRoom, useEstimateStore, useRoomCalcs, useToolCalcs } from "@/entities/estimate";
import { roomDimensions, roomPatch } from "@/entities/room";
import type { ToolValues } from "@/entities/tool";
import { RoomBar } from "@/features/edit-room";
import { AddToList, RoomList } from "@/features/room-list";
import { ResultActions, shareUrl } from "@/features/share-result";
import { track } from "@/shared/analytics";
import { AdSlot } from "@/shared/ui";
import { planRoomOf } from "../model/plan";
import { fieldsOf, sizeParts } from "../model/room";
import { useCalcEvents } from "../model/useCalcEvents";
import { useCalculator } from "../model/useCalculator";
import { describeResult, resultText } from "../model/view";
import { CalcLabel } from "./CalcLabel";
import { HowCalculated } from "./HowCalculated";
import { NextSteps } from "./NextSteps";
import { PrintSheet } from "./PrintSheet";
import { ResultPanel } from "./ResultPanel";
import { StickyResultBar } from "./StickyResultBar";
import { ToolForm } from "./ToolForm";

/**
 * The scheme card sits below the form and the result, never on the first screen: it is rendered in the browser
 * only, and its code (pictures, guides, cut lists) stays out of the first-screen JS budget.
 */
const CalcChips = dynamic(() => import("./Calcs").then((m) => m.CalcChips), { ssr: false });
const CalcOverlapHint = dynamic(() => import("./Calcs").then((m) => m.CalcOverlapHint), { ssr: false });
const LayoutScheme = dynamic(() => import("./LayoutScheme").then((m) => m.LayoutScheme), { ssr: false });

export interface CalculatorShellProps {
  category: string;
  toolId: string;
  /** YYYY-MM-DD from the content file, for «Проверено …». */
  checkedAt?: string;
  /** Norm sources for «Как посчитано», looked up on the server (`normSources`). */
  sources?: readonly string[];
  /** This tool's calc module (`ToolCalculator` loads only it). */
  module: ToolModule<ToolValues>;
}

/**
 * The one component that renders every tool (docs/ui/calculator-shell-and-pages.md). Phone: room, form, result
 * in one column with a sticky result bar; from 1024 px form 5/12 left, result 7/12 right and sticky.
 */
export function CalculatorShell({ category, toolId, checkedAt, sources, module }: CalculatorShellProps) {
  const tool = getTool(category, toolId);
  if (!tool) throw new Error(`Unknown tool ${category}/${toolId}`);
  const calc = useCalculator(tool, module);
  const country = useCountry();
  const room = useActiveRoom();
  const toolCalcs = useToolCalcs(tool.id);
  const roomCalcs = useRoomCalcs();
  const current = toolCalcs.find((c) => c.id === calc.calcId);
  const removeCalc = (id: string) => {
    const store = useEstimateStore.getState();
    store.removeCalc(id);
    toast(shell.calcs.removed, { action: { label: shell.calcs.undo, onClick: () => store.undoRemove() } });
  };
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
  useCalcEvents({
    tool,
    country,
    values,
    edits: calc.edits,
    fieldsChanged: calc.fieldsChanged,
    panelVisible,
  });
  const getUrl = useCallback(() => shareUrl(window.location.href, values, defaults), [values, defaults]);
  const getText = () => resultText(tool, view);
  const layout = calc.result.layout;
  // The plan editor of the scheme card edits the doors and windows field: the plan field, or the openings list.
  const planField =
    tool.fields.find((field) => field.kind === "plan") ?? tool.fields.find((field) => field.kind === "openings");

  return (
    <>
      <div className="flex flex-col gap-6 print:hidden">
        <div className="grid gap-3 lg:grid-cols-12 lg:items-start lg:gap-6">
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-5 lg:rounded-xl lg:border lg:border-border lg:bg-surface lg:p-6 lg:shadow-sm">
            <RoomBar
              tool={tool}
              draft={roomPatch(values, tool.fields)}
              parts={sizeParts(tool.fields, values)}
              onSizes={(patch) => calc.setValues(fieldsOf(patch, tool.fields))}
              onInvalid={(part, bad) => {
                for (const name of Object.keys(fieldsOf({ [part]: 0 }, tool.fields))) calc.setInvalid(name, bad);
              }}
            />
            {tool.items && toolCalcs.length > 0 ? (
              <CalcChips
                tool={tool}
                calcs={toolCalcs}
                currentId={calc.calcId}
                onOpen={calc.openCalc}
                onAdd={calc.addCalc}
                onRemove={removeCalc}
              />
            ) : null}
            <ToolForm
              tool={tool}
              values={values}
              defaults={defaults}
              onChange={calc.setValues}
              onInvalid={calc.setInvalid}
              extra={tool.items ? <CalcLabel value={current?.label ?? ""} onChange={calc.setLabel} /> : undefined}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[88px] lg:col-span-7">
            <ResultPanel ref={panel} tool={tool} view={view} example={calc.example} stale={calc.stale} />
            <ResultActions
              title={tool.title}
              getText={getText}
              getUrl={getUrl}
              onAction={(action) =>
                action === "copy"
                  ? track("result_copied", { tool: tool.id })
                  : track("project_shared", { channel: action })
              }
              primary={
                view.mode === "buy" ? (
                  <AddToList
                    added={current?.addedAt !== undefined}
                    onAdd={() => {
                      const id = calc.ensureCalc();
                      if (id) useEstimateStore.getState().markAdded(id);
                    }}
                    className="min-w-32 flex-1"
                  />
                ) : undefined
              }
            />
            {current?.surface ? <CalcOverlapHint current={current} calcs={roomCalcs} onSplit={calc.splitCalc} /> : null}
            <AdSlot placement="after-result" />
          </div>
        </div>
        {/* Outside the grid: the sticky result column ends with the grid, so the scheme never slides under it. */}
        {layout ? (
          <LayoutScheme
            tool={tool}
            layout={layout}
            room={planRoomOf(values)}
            openings={planField ? (values[planField.name] as readonly Opening[]) : undefined}
            onOpeningsChange={planField ? (next) => calc.setValues({ [planField.name]: next }) : undefined}
            {...(Array.isArray(values.zones)
              ? { zones: values.zones as readonly BareZone[], onZonesChange: (next) => calc.setValues({ zones: next }) }
              : {})}
          />
        ) : null}
        <RoomList />
        <NextSteps tool={tool} />
        <HowCalculated tool={tool} steps={view.steps} checkedAt={checkedAt} sources={sources} />
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
