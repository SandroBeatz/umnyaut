"use client";

import type { Layout, LayoutPiece, Opening } from "@umnyaut/calc";
import { lengthUnitLabels, shell, type ToolDef } from "@umnyaut/catalog";
import { Button, Dialog, DialogContent, DialogTrigger } from "@umnyaut/ui";
import { ChevronDown, MapPin, Maximize2 } from "lucide-react";
import { useId } from "react";
import { FloorPlan } from "@/entities/room";
import { PlanEditor, type PlanRoom } from "@/features/edit-room-plan";
import { fill } from "@/shared/lib";
import { guideLines, rowLines } from "../model/scheme-text";

const s = shell.scheme;
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

/** The plan with every piece: whole outlined, cut hatched teal, reused with the orange dot (design spec §11). */
function SchemePicture({ layout, className }: { layout: Layout; className?: string }) {
  const hatch = useId();
  const size = Math.max(layout.widthMm, layout.heightMm);
  const step = size * 0.012;
  const simple = layout.pieces.length > MAX_PIECES;
  const pieces = simple ? bands(layout.pieces) : layout.pieces;
  const rowHeads = new Map<number, LayoutPiece>();
  // Row numbers in each row's start piece, when there are few enough rows to read them.
  if (!simple && (layout.rows?.length ?? 0) <= 40) {
    for (const p of layout.pieces) if (p.row !== undefined && !rowHeads.has(p.row)) rowHeads.set(p.row, p);
  }
  return (
    <FloorPlan
      outline={layout.outline}
      walls={layout.walls}
      marks={layout.marks}
      unit={lengthUnitLabels.m}
      startLabel={s.start}
      label={fill(s.label, { rows: layout.rows?.length ?? 0, whole: layout.stats.whole, cut: layout.stats.cut })}
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
          x={p.x + Math.min(p.w, p.h) * 0.25}
          y={p.y + p.h / 2}
          fontSize={Math.min(p.h, p.w) * 0.55}
          dominantBaseline="central"
          className="fill-text-muted"
        >
          {row + 1}
        </text>
      ))}
    </FloorPlan>
  );
}

/**
 * «Схема укладки» card under the result (docs/ui/room-plan-and-layout-guides.md): the plan with the pieces the
 * purchase was counted on, legend with counts, «Как укладывать» steps, the cut list per row, the plan editor
 * for doors and windows, and the scheme fullscreen on tap. The text summary is the image's alternative.
 */
export function LayoutScheme({ tool, layout, room, openings, onOpeningsChange }: LayoutSchemeProps) {
  const { whole, cut, reused } = layout.stats;
  const rows = layout.rows?.length ?? 0;
  const guide = guideLines(tool, layout);
  const placedAny = (openings ?? []).some((o) => (o.places?.length ?? 0) > 0);
  const title = fill(s.summary, { rows, whole, cut });

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
                <MapPin aria-hidden="true" />
                {placedAny ? shell.plan.edit : shell.plan.open}
              </Button>
            }
          />
        ) : null}
      </div>

      {/* Desktop: the picture on the left (7/12), legend, steps and cut list on the right (5/12). */}
      <div className="flex flex-col gap-3 lg:col-span-7">
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={s.enlarge}
              className="block w-full cursor-zoom-in rounded-md focus-visible:outline-2"
            >
              <SchemePicture layout={layout} className="w-full lg:max-h-[640px]" />
            </button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button variant="ghost" className="self-start">
              <Maximize2 aria-hidden="true" />
              {s.enlarge}
            </Button>
          </DialogTrigger>
          <DialogContent
            title={s.title}
            description={title}
            closeLabel={shell.close}
            className="max-w-[min(96vw,1100px)]"
          >
            <SchemePicture layout={layout} className="max-h-[80dvh] w-full" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 lg:col-span-5">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-small text-text">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-4 border border-text-subtle bg-surface" />
            {fill(s.legendWhole, { count: whole })}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-3 w-4 border border-text-subtle bg-[repeating-linear-gradient(45deg,var(--color-primary)_0_1px,var(--color-primary-soft)_1px_4px)]"
            />
            {fill(s.legendCut, { count: cut })}
          </li>
          {reused > 0 ? (
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              {fill(s.legendReused, { count: reused })}
            </li>
          ) : null}
        </ul>

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
          <details className="group rounded-md border border-border">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 text-body-strong text-primary">
              {s.cutList}
              <ChevronDown aria-hidden="true" className="size-5 transition-transform group-open:rotate-180" />
            </summary>
            <ol className="flex flex-col divide-y divide-border px-3 pb-2 text-small">
              {rowLines(layout.rows).map((row) => (
                <li key={row.title} className="py-2">
                  <p className="font-semibold text-text tabular-nums">{row.title}</p>
                  <p className="text-text-muted tabular-nums">{row.parts.join(" · ")}</p>
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </div>
    </section>
  );
}
