"use client";

import type { Layout, LayoutPiece, Opening } from "@umnyaut/calc";
import { lengthUnitLabels, shell, type ToolDef } from "@umnyaut/catalog";
import { Button, LazyDialog, preloadDialog } from "@umnyaut/ui";
import { ChevronDown, Maximize2, PencilRuler } from "lucide-react";
import { useId, useRef, useState } from "react";
import { FloorPlan } from "@/entities/room";
import { PlanEditor, type PlanRoom } from "@/features/edit-room-plan";
import { fill } from "@/shared/lib";
import { guideLines, rowLines, runLines, sheetLines } from "../model/scheme-text";

const s = shell.scheme;
const t = s.strips;
const r = s.runs;
const g = s.grid;
/** Design spec §11: above this many pieces the scheme draws rows as bands. */
const MAX_PIECES = 2000;

export interface LayoutSchemeProps {
  tool: ToolDef;
  layout: Layout;
  /** Room as the plan editor sees it; with `onOpeningsChange` the card offers «Отметить на плане». */
  room: PlanRoom;
  openings?: readonly Opening[];
  onOpeningsChange?(next: readonly Opening[]): void;
}

/** Row bands for a huge layout: one rectangle per row around its pieces. */
function bands(pieces: readonly LayoutPiece[]): LayoutPiece[] {
  const rows = new Map<number, LayoutPiece>();
  for (const p of pieces) {
    const key = p.row ?? 0;
    const b = rows.get(key);
    if (!b) rows.set(key, { ...p, cut: false, reused: undefined });
    else {
      const x = Math.min(b.x, p.x);
      const y = Math.min(b.y, p.y);
      rows.set(key, { ...b, x, y, w: Math.max(b.x + b.w, p.x + p.w) - x, h: Math.max(b.y + b.h, p.y + p.h) - y });
    }
  }
  return [...rows.values()];
}

/** Card summary, the picture's text alternative and legend: rows of boards, sheets of a roll or plinth runs. */
function texts(layout: Layout) {
  const { whole, cut, reused } = layout.stats;
  const lines = layout.marks.filter((m) => m.kind === "seam").length;
  if (layout.kind === "strips") {
    const counts = { sheets: layout.sheets?.length ?? 0, seams: lines };
    return {
      summary: fill(t.summary, counts),
      label: fill(t.label, counts),
      whole: fill(t.legendWhole, { count: whole }),
      cut: fill(t.legendCut, { count: cut }),
      reused: "",
      line: t.legendSeam,
    };
  }
  if (layout.kind === "grid") {
    const counts = { pieces: whole + cut, whole, cut };
    return {
      summary: fill(g.summary, counts),
      label: fill(g.label, counts),
      whole: fill(g.legendWhole, { count: whole }),
      cut: fill(g.legendCut, { count: cut }),
      reused: "",
      line: g.legendAxis,
    };
  }
  if (layout.kind === "outline") {
    const runs = layout.runs ?? [];
    const counts = { runs: runs.length, planks: Math.max(0, ...runs.flatMap((r) => r.pieces.map((p) => p.plank))) };
    return {
      summary: runs.length > 0 ? fill(r.summary, counts) : r.empty,
      label: fill(r.label, counts),
      whole: fill(r.legendWhole, { count: whole }),
      cut: fill(r.legendCut, { count: cut }),
      reused: fill(r.legendReused, { count: reused }),
      line: r.legendJoint,
    };
  }
  const counts = { rows: layout.rows?.length ?? 0, whole, cut };
  return {
    summary: fill(s.summary, counts),
    label: fill(s.label, counts),
    whole: fill(s.legendWhole, { count: whole }),
    cut: fill(s.legendCut, { count: cut }),
    reused: fill(s.legendReused, { count: reused }),
    line: t.legendSeam,
  };
}

/** The plan with every piece: whole outlined, cut hatched teal, reused with the orange dot (design spec §11). */
function SchemePicture({ layout, className }: { layout: Layout; className?: string }) {
  const hatch = useId();
  const size = Math.max(layout.widthMm, layout.heightMm);
  const step = size * 0.012;
  const simple = layout.pieces.length > MAX_PIECES;
  const pieces = simple ? bands(layout.pieces) : layout.pieces;
  const rowHeads = new Map<number, LayoutPiece>();
  // Row numbers in each row's start piece, when there are few enough rows to read them.
  if (!simple && (layout.kind === "rows" || layout.kind === "strips") && (layout.rows?.length ?? 0) <= 40) {
    for (const p of layout.pieces) if (p.row !== undefined && !rowHeads.has(p.row)) rowHeads.set(p.row, p);
  }
  return (
    <FloorPlan
      outline={layout.outline}
      walls={layout.walls}
      marks={layout.marks}
      unit={lengthUnitLabels.m}
      startLabel={s.start}
      label={texts(layout).label}
      className={className}
    >
      <defs>
        <pattern id={hatch} patternUnits="userSpaceOnUse" width={step} height={step} patternTransform="rotate(45)">
          <rect width={step} height={step} className="fill-primary-soft" />
          <line x1={0} y1={0} x2={0} y2={step} strokeWidth={step * 0.3} className="stroke-primary" />
        </pattern>
      </defs>
      {pieces.map((p, i) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: pieces are positional and rebuilt on every change
          key={i}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          fill={p.cut ? `url(#${hatch})` : undefined}
          vectorEffect="non-scaling-stroke"
          strokeWidth={1}
          className={
            p.cut
              ? "stroke-text-subtle"
              : simple
                ? "fill-surface-mint stroke-text-subtle"
                : "fill-surface stroke-text-subtle"
          }
        />
      ))}
      {simple
        ? null
        : pieces
            .filter((p) => p.reused)
            .map((p, i) => (
              <circle
                // biome-ignore lint/suspicious/noArrayIndexKey: pieces are positional and rebuilt on every change
                key={i}
                cx={p.x + p.w / 2}
                cy={p.y + p.h / 2}
                r={Math.min(p.w, p.h, size * 0.04) * 0.3}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1.5}
                className="fill-accent stroke-white"
              />
            ))}
      {[...rowHeads.entries()].map(([row, p]) => (
        <text
          key={row}
          x={p.x + Math.min(p.w, p.h, size * 0.08) * 0.25}
          y={p.y + p.h / 2}
          fontSize={Math.min(p.h, p.w, size * 0.08) * 0.55}
          dominantBaseline="central"
          className="fill-text-muted"
        >
          {row + 1}
        </text>
      ))}
    </FloorPlan>
  );
}

/** «Что резать по рядам» / «Что отрезать от рулона»: one line per row or sheet, folded. */
function CutList({ title, lines }: { title: string; lines: readonly { title: string; parts: string[] }[] }) {
  return (
    <details className="group rounded-md border border-border">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 text-body-strong text-primary">
        {title}
        <ChevronDown aria-hidden="true" className="size-5 transition-transform group-open:rotate-180" />
      </summary>
      <ol className="flex flex-col divide-y divide-border px-3 pb-2 text-small">
        {lines.map((line) => (
          <li key={line.title} className="py-2">
            <p className="font-semibold text-text tabular-nums">{line.title}</p>
            <p className="text-text-muted tabular-nums">{line.parts.join(" · ")}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}

/**
 * «Схема укладки» card under the result (docs/ui/room-plan-and-layout-guides.md): the plan with the pieces the
 * purchase was counted on, legend with counts, «Как укладывать» steps, the cut list per row, the plan editor
 * for doors and windows, and the scheme fullscreen on tap. The text summary is the image's alternative.
 */
export function LayoutScheme({ tool, layout, room, openings, onOpeningsChange }: LayoutSchemeProps) {
  const { reused } = layout.stats;
  const seams = layout.marks.filter((m) => m.kind === "seam").length;
  const labels = texts(layout);
  const guide = guideLines(tool, layout);
  const placedAny = (openings ?? []).some((o) => (o.places?.length ?? 0) > 0);
  const title = labels.summary;
  const [fullscreen, setFullscreen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const enlarge = (event: { currentTarget: HTMLElement }) => {
    opener.current = event.currentTarget;
    setFullscreen(true);
  };

  return (
    <section
      aria-labelledby="layout-scheme"
      className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm lg:grid-cols-12 lg:gap-x-6 lg:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 lg:col-span-12">
        <div className="min-w-0">
          <h2 id="layout-scheme" className="text-h3 text-text">
            {s.title}
          </h2>
          <p className="text-small text-text-muted tabular-nums">{title}</p>
        </div>
        {openings && onOpeningsChange ? (
          <PlanEditor
            room={room}
            openings={openings}
            onChange={onOpeningsChange}
            trigger={
              <Button variant="secondary">
                <PencilRuler aria-hidden="true" />
                {placedAny ? shell.plan.edit : shell.plan.open}
              </Button>
            }
          />
        ) : null}
      </div>

      {/* Desktop: the picture on the left (7/12), legend, steps and cut list on the right (5/12). */}
      <div className="flex flex-col gap-3 lg:col-span-7">
        <button
          type="button"
          aria-label={s.enlarge}
          aria-haspopup="dialog"
          className="block w-full cursor-zoom-in rounded-md focus-visible:outline-2"
          onClick={enlarge}
          onPointerEnter={preloadDialog}
          onFocus={preloadDialog}
        >
          <SchemePicture layout={layout} className="w-full lg:max-h-[640px]" />
        </button>
        <Button
          variant="ghost"
          className="self-start"
          aria-haspopup="dialog"
          onClick={enlarge}
          onPointerEnter={preloadDialog}
          onFocus={preloadDialog}
        >
          <Maximize2 aria-hidden="true" />
          {s.enlarge}
        </Button>
        <LazyDialog
          open={fullscreen}
          onOpenChange={setFullscreen}
          returnFocus={opener}
          title={s.title}
          description={title}
          closeLabel={shell.close}
          className="max-w-[min(96vw,1100px)]"
        >
          <SchemePicture layout={layout} className="max-h-[80dvh] w-full" />
        </LazyDialog>
      </div>

      <div className="flex flex-col gap-3 lg:col-span-5">
        {layout.pieces.length > 0 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-small text-text">
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-3 w-4 border border-text-subtle bg-surface" />
              {labels.whole}
            </li>
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-3 w-4 border border-text-subtle bg-[repeating-linear-gradient(45deg,var(--color-primary)_0_1px,var(--color-primary-soft)_1px_4px)]"
              />
              {labels.cut}
            </li>
            {seams > 0 ? (
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="w-4 border-text border-t-2 border-dashed" />
                {labels.line}
              </li>
            ) : null}
            {reused > 0 ? (
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
                {labels.reused}
              </li>
            ) : null}
          </ul>
        ) : null}

        {guide.length > 0 ? (
          <div>
            <h3 className="text-body-strong text-text">{s.guide}</h3>
            <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5 text-small text-text">
              {guide.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
        ) : null}

        {layout.rows && layout.rows.length > 0 ? (
          <CutList title={s.cutList} lines={rowLines(layout.rows)} />
        ) : layout.sheets && layout.sheets.length > 0 ? (
          <CutList title={t.cutList} lines={sheetLines(layout.sheets)} />
        ) : layout.runs && layout.runs.length > 0 ? (
          <CutList title={r.cutList} lines={runLines(layout.runs)} />
        ) : null}
      </div>
    </section>
  );
}
