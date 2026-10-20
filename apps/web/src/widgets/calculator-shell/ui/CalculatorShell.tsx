"use client";

import type { BareZone, EstimateCalc, Opening, ToolModule } from "@umnyaut/calc";
import { shell, type ToolDef, unitLabels } from "@umnyaut/catalog";
import { toast, UnitToggle } from "@umnyaut/ui";
import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCountry } from "@/entities/country";
import {
  ESTIMATE_KEY,
  hydrateEstimate,
  useActiveRoom,
  useEstimateStore,
  useRoomCalcs,
  useToolCalcs,
} from "@/entities/estimate";
import { roomDimensions, roomPatch } from "@/entities/room";
import type { ToolValues } from "@/entities/tool";
import { RoomBar } from "@/features/edit-room";
import type { SharedItemView } from "@/features/estimate-totals";
import { AddToList } from "@/features/room-list";
import { ResultActions, shareUrl } from "@/features/share-result";
import { track } from "@/shared/analytics";
import { AdSlot } from "@/shared/ui";
import { manyCalcs, nextSurface } from "../model/calcs";
import { hasRoomUnits, type LengthUnit } from "../model/fields";
import { planRoomOf } from "../model/plan";
import { type ListProducts, listStart, takeOffers } from "../model/shared";
import { useCalcEvents } from "../model/useCalcEvents";
import { useCalculator } from "../model/useCalculator";
import { describeResult, resultText } from "../model/view";
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
const EstimateSync = dynamic(() => import("@/features/estimate-totals").then((m) => m.EstimateSync), { ssr: false });
const CalcChips = dynamic(() => import("./Calcs").then((m) => m.CalcChips), { ssr: false });
const CalcOverlapHint = dynamic(() => import("./Calcs").then((m) => m.CalcOverlapHint), { ssr: false });
const LayoutScheme = dynamic(() => import("./LayoutScheme").then((m) => m.LayoutScheme), { ssr: false });

export interface CalculatorShellProps {
  /** The tool, looked up on the server: the registry of all tools stays out of the page's JS. */
  tool: ToolDef;
  /** «Дальше по ремонту», resolved on the server too. */
  next: readonly ToolDef[];
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
export function CalculatorShell({ tool, next, checkedAt, sources, module }: CalculatorShellProps) {
  const calc = useCalculator(tool, module);
  const [unit, setUnit] = useState<LengthUnit>("m");
  const country = useCountry();
  const room = useActiveRoom();
  const toolCalcs = useToolCalcs(tool.id);
  const roomCalcs = useRoomCalcs();
  const current = toolCalcs.find((c) => c.id === calc.calcId);
  // Only when there is a choice: two calcs, or one and a free surface for «+ Ещё».
  const showChips = toolCalcs.length > 1 || (toolCalcs.length === 1 && nextSurface(tool, toolCalcs) !== undefined);
  const [shared, setShared] = useState<Readonly<Record<string, SharedItemView>>>();
  const [products, setProducts] = useState<ListProducts>({});
  const removeCalc = (id: string) => {
    const store = useEstimateStore.getState();
    store.removeCalc(id);
    toast(shell.calcs.removed, { action: { label: shell.calcs.undo, onClick: () => store.undoRemove() } });
  };
  const view = describeResult(tool, calc.result, country, {
    ...(module.priceBasis ? { basis: module.priceBasis } : {}),
    values: calc.values,
  });

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
  const items = calc.result.items;
  const offers = useMemo(() => takeOffers(tool, values, items, products), [tool, values, items, products]);
  // A calc not yet started takes the list's adhesive, grout and primer (spec «Калькулятор»).
  const { startFromList, calcId } = calc;
  useEffect(() => {
    if (calcId) return;
    const patch = listStart(tool, values, items, products);
    if (Object.keys(patch).length > 0) startFromList(patch);
  }, [tool, values, items, products, calcId, startFromList]);
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
            {/* First the units, then the fields: the heading row holds the м/см switch. */}
            <div className="flex min-h-12 items-center justify-between gap-3">
              <h2 className="text-h3">{tool.items ? shell.form.title : shell.form.titleSizes}</h2>
              {hasRoomUnits(tool.fields) ? (
                <UnitToggle
                  label={shell.form.units}
                  labels={shell.form.unitLabels}
                  value={unit}
                  onValueChange={setUnit}
                />
              ) : null}
            </div>
            <RoomBar tool={tool} draft={roomPatch(values, tool.fields)} example={calc.example} />
            {tool.items && manyCalcs(tool) ? (
              <ChipsSlot tool={tool} show={showChips}>
                {showChips ? (
                  <CalcChips
                    tool={tool}
                    calcs={toolCalcs}
                    currentId={calc.calcId}
                    onOpen={calc.openCalc}
                    onAdd={calc.addCalc}
                    onRemove={removeCalc}
                  />
                ) : null}
              </ChipsSlot>
            ) : null}
            <ToolForm
              tool={tool}
              values={values}
              defaults={defaults}
              onChange={calc.setValues}
              onInvalid={calc.setInvalid}
              unit={unit}
              offers={offers}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[128px] lg:col-span-7">
            <ResultPanel
              ref={panel}
              tool={tool}
              view={view}
              example={calc.example}
              stale={calc.stale}
              room={room?.name}
              shared={shared}
            />
            {tool.items ? <EstimateSync calcId={calc.calcId} onShared={setShared} onProducts={setProducts} /> : null}
            <ResultActions
              title={tool.title}
              getText={getText}
              getUrl={getUrl}
              onAction={(action) => {
                if (action === "copy") track("result_copied", { tool: tool.id });
                else track("project_shared", { channel: action });
              }}
              primary={
                view.mode === "buy" ? (
                  <AddToList
                    state={current?.addedAt === undefined ? "add" : current.draft ? "update" : "added"}
                    onAdd={calc.addToEstimate}
                    onUpdate={calc.updateEstimate}
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
        <NextSteps tool={tool} next={next} />
        <HowCalculated tool={tool} steps={view.steps} checkedAt={checkedAt} sources={sources} />
      </div>
      <PrintSheet tool={tool} view={view} items={calc.result.items} room={roomDimensions(room, unitLabels.m)} />
      <StickyResultBar text={view.short} visible={!panelVisible} inEstimate={current?.addedAt !== undefined} />
    </>
  );
}

/**
 * The row of calc chips appears after mount (calcs live in the browser), and below it sit the form and the result: a
 * returning visitor would see them jump by a row (CLS 0.06 on the tile page, P17.15 gate 0.05). An inline script
 * right after the empty slot reads the stored estimate while the HTML is parsed and, when the chips will show,
 * reserves their height before the first paint. A first-time visitor gets no reserve: the first screen stays within
 * 660 px. The reserve is dropped once the estimate is read and the chips turn out not to show.
 */
function ChipsSlot({ tool, show, children }: { tool: ToolDef; show: boolean; children: ReactNode }) {
  const slot = useRef<HTMLDivElement>(null);
  const [read, setRead] = useState(false);
  useEffect(() => {
    void hydrateEstimate().then(() => setRead(true));
  }, []);
  useLayoutEffect(() => {
    if (read && !show) slot.current?.removeAttribute("data-reserve");
  }, [read, show]);
  return (
    <>
      <div
        ref={slot}
        data-chips-slot
        suppressHydrationWarning
        className="empty:not-data-reserve:hidden data-reserve:min-h-12"
      >
        {children}
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: our own code; the only data are a slug and surface names, `<` escaped */}
      <script dangerouslySetInnerHTML={{ __html: reserveScript(tool) }} />
    </>
  );
}

/** Same rule as `showChips`, in plain JS: the surfaces that leave a free one for «+ Ещё» are worked out here. */
function reserveScript(tool: ToolDef): string {
  const surfaces = tool.surface && "field" in tool.surface ? Object.values(tool.surface.values) : [];
  const roomy = [...surfaces, ""].filter(
    (surface) => nextSurface(tool, [{ surface: surface || undefined } as EstimateCalc]) !== undefined,
  );
  // Data as JSON with `<` escaped, so nothing can close the script tag.
  const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
  return `(function(slot){try{var e=JSON.parse(localStorage.getItem(${json(ESTIMATE_KEY)})).state.estimate;var c=e.calcs.filter(function(x){return x.roomId===e.activeRoomId&&x.tool===${json(tool.id)}});if(c.length>1||(c.length===1&&${json(roomy)}.indexOf(c[0].surface||"")>=0))slot.setAttribute("data-reserve","")}catch(_){}})(document.currentScript.previousElementSibling)`;
}
