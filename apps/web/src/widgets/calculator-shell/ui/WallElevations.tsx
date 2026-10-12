import type { Layout, LayoutElevation, LayoutPiece } from "@umnyaut/calc";
import { lengthUnitLabels, schemeStrings, shell } from "@umnyaut/catalog";
import { formatNumber } from "@umnyaut/ui/format";
import { useId } from "react";
import { FloorPlan } from "@/entities/room";
import { fill } from "@/shared/lib";

const w = schemeStrings.grid.walls;
const strips = schemeStrings.strips.walls;
const m = (mm: number) => formatNumber(mm / 1000, { maxFraction: 2 });
/** Hatching step on a wall, mm: the same on every wall, so the cuts look alike. */
const HATCH_MM = 45;

/** The wall's text alternative: tiles counted on it, or the wallpaper strips hung on it. */
function labelOf(e: LayoutElevation) {
  const length = m(e.lengthMm);
  if (e.strips) {
    const numbers = e.strips.columns.filter((c) => c.kind !== "pieces").map((c) => c.n);
    const first = numbers.length > 0 ? Math.min(...numbers) : "—";
    const last = numbers.length > 0 ? Math.max(...numbers) : "—";
    return fill(strips.wallLabel, { n: e.wall + 1, length, first, last });
  }
  const cut = e.pieces.filter((p) => p.cut).length;
  return fill(w.wallLabel, { n: e.wall + 1, length, whole: e.pieces.length - cut, cut });
}

/**
 * `scale`: this wall's length over the longest one, so every wall is drawn to the same scale. Wallpaper strips
 * carry their number at the top and the rest of a corner strip the orange dot.
 */
function Elevation({
  elevation,
  scale,
  startLineMm,
}: {
  elevation: LayoutElevation;
  scale: number;
  /** Wallpaper: the start line, on the start wall only. */
  startLineMm?: number;
}) {
  const hatch = useId();
  const bare = useId();
  const { lengthMm: L, heightMm: H, pieces } = elevation;
  const label = labelOf(elevation);
  // Wallpaper: a number on each full-height strip, «К1» on the top piece of each pieces column.
  const numbers = new Map<string, { p: LayoutPiece; text: string }>();
  if (elevation.strips)
    for (const p of pieces) {
      const key = p.piece !== undefined ? `k${p.piece}` : p.row !== undefined && !p.reused ? `s${p.row}` : undefined;
      if (key && !numbers.has(key))
        numbers.set(key, {
          p,
          text: p.piece !== undefined ? fill(strips.pieceMark, { n: p.piece }) : String((p.row ?? 0) + 1),
        });
    }
  const font = Math.min(H * 0.07, 160);
  return (
    // Spans only: the scheme sits inside the «open fullscreen» button.
    <span className="flex min-w-0 flex-col gap-1">
      <span className="text-left text-small font-semibold text-text tabular-nums">
        {fill(w.wall, { n: elevation.wall + 1, length: m(L) })}
      </span>
      <svg
        viewBox={`0 0 ${L} ${H}`}
        role="img"
        aria-label={label}
        className="max-w-full"
        style={{ width: `${scale * 100}%` }}
      >
        <defs>
          <pattern
            id={hatch}
            patternUnits="userSpaceOnUse"
            width={HATCH_MM}
            height={HATCH_MM}
            patternTransform="rotate(45)"
          >
            <rect width={HATCH_MM} height={HATCH_MM} className="fill-primary-soft" />
            <line x1={0} y1={0} x2={0} y2={HATCH_MM} strokeWidth={HATCH_MM * 0.3} className="stroke-primary" />
          </pattern>
          <pattern
            id={bare}
            patternUnits="userSpaceOnUse"
            width={HATCH_MM * 2}
            height={HATCH_MM * 2}
            patternTransform="rotate(-45)"
          >
            <rect width={HATCH_MM * 2} height={HATCH_MM * 2} className="fill-surface-sunken" />
            <line x1={0} y1={0} x2={0} y2={HATCH_MM * 2} strokeWidth={HATCH_MM * 0.25} className="stroke-border" />
          </pattern>
        </defs>
        <rect width={L} height={H} className="fill-surface" />
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
            className={p.cut ? "stroke-text-subtle" : "fill-surface stroke-text-subtle"}
          />
        ))}
        {pieces
          .filter((p) => p.reused)
          .map((p, i) => (
            <circle
              // biome-ignore lint/suspicious/noArrayIndexKey: pieces are positional and rebuilt on every change
              key={i}
              cx={p.x + p.w / 2}
              cy={p.y + p.h / 2}
              r={Math.min(p.w * 0.3, font * 0.5)}
              vectorEffect="non-scaling-stroke"
              strokeWidth={1.5}
              className="fill-accent stroke-white"
            />
          ))}
        {[...numbers.entries()].map(([key, { p, text }]) => (
          <text
            key={key}
            x={p.x + p.w / 2}
            y={p.y + Math.min(font * 0.9, p.h * 0.8)}
            fontSize={Math.min(font, p.w * 0.45, p.h * 0.8)}
            textAnchor="middle"
            className="fill-text-muted"
          >
            {text}
          </text>
        ))}
        {elevation.openings
          .filter((o) => o.type === "bare")
          .map((o, i) => (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: zones are positional and rebuilt on every change
              key={`bare${i}`}
              x={o.x}
              y={o.y}
              width={o.w}
              height={o.h}
              fill={`url(#${bare})`}
              vectorEffect="non-scaling-stroke"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              className="stroke-text-muted"
            />
          ))}
        {(elevation.strips?.linesMm ?? []).map((x) => (
          <line
            key={`line${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={H}
            vectorEffect="non-scaling-stroke"
            strokeWidth={x === startLineMm ? 2.5 : 1.5}
            strokeDasharray={x === startLineMm ? undefined : "6 4"}
            className="stroke-primary"
          />
        ))}
        {elevation.openings
          .filter((o) => o.type !== "bare")
          .map((o, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: openings are positional and rebuilt on every change
            <g key={i}>
              <rect
                x={o.x}
                y={o.y}
                width={o.w}
                height={o.h}
                vectorEffect="non-scaling-stroke"
                strokeWidth={2}
                className="fill-surface-sunken stroke-text"
              />
              {o.type === "window" ? (
                // A window: the frame's cross.
                <path
                  d={`M${o.x + o.w / 2} ${o.y}V${o.y + o.h}M${o.x} ${o.y + o.h / 2}H${o.x + o.w}`}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={1}
                  className="stroke-text-muted"
                />
              ) : (
                // A door: the handle side.
                <circle
                  cx={o.x + o.w * 0.85}
                  cy={o.y + o.h * 0.55}
                  r={Math.min(o.w, o.h) * 0.04}
                  className="fill-text"
                />
              )}
            </g>
          ))}
        <rect
          width={L}
          height={H}
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeWidth={2}
          className="stroke-text"
        />
      </svg>
    </span>
  );
}

export interface WallElevationsProps {
  layout: Layout;
  /** Two walls per row (the card); one on a phone in fullscreen. */
  columns: "two" | "responsive";
}

/**
 * Wall schemes (docs/ui/room-plan-and-layout-guides.md) — tiles or wallpaper: the floor plan for which wall is
 * which, then every wall unfolded as seen from the room, with the pieces the purchase counted.
 */
export function WallElevations({ layout, columns }: WallElevationsProps) {
  const elevations = layout.elevations ?? [];
  const longest = Math.max(1, ...elevations.map((e) => e.lengthMm));
  return (
    <span className="flex flex-col gap-3">
      <FloorPlan
        outline={layout.outline}
        walls={layout.walls}
        marks={layout.marks}
        unit={lengthUnitLabels.m}
        startLabel={schemeStrings.start}
        label={fill(shell.plan.planLabel, {
          length: formatNumber(layout.widthMm / 1000),
          width: formatNumber(layout.heightMm / 1000),
          unit: lengthUnitLabels.m,
        })}
        className="mx-auto max-h-40 w-full"
      />
      <span className="text-left text-small text-text-muted">{w.view}</span>
      <span className={columns === "two" ? "grid grid-cols-2 gap-3" : "grid gap-4 sm:grid-cols-2"}>
        {elevations.map((e) => (
          <Elevation
            key={e.wall}
            elevation={e}
            scale={e.lengthMm / longest}
            {...(layout.start?.wall === e.wall ? { startLineMm: layout.start.lineMm } : {})}
          />
        ))}
      </span>
    </span>
  );
}
