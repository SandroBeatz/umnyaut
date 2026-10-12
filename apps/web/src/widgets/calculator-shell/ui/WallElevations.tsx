import type { Layout, LayoutElevation } from "@umnyaut/calc";
import { lengthUnitLabels, shell } from "@umnyaut/catalog";
import { formatNumber } from "@umnyaut/ui/format";
import { useId } from "react";
import { FloorPlan } from "@/entities/room";
import { fill } from "@/shared/lib";

const w = shell.scheme.grid.walls;
const m = (mm: number) => formatNumber(mm / 1000, { maxFraction: 2 });
/** Hatching step on a wall, mm: the same on every wall, so the cuts look alike. */
const HATCH_MM = 45;

/** One wall seen from the room: tiles (whole outlined, cut hatched), doors and windows on top. */
/** `scale`: this wall's length over the longest one, so every wall is drawn to the same scale. */
function Elevation({ elevation, scale }: { elevation: LayoutElevation; scale: number }) {
  const hatch = useId();
  const { lengthMm: L, heightMm: H, pieces } = elevation;
  const cut = pieces.filter((p) => p.cut).length;
  const label = fill(w.wallLabel, { n: elevation.wall + 1, length: m(L), whole: pieces.length - cut, cut });
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
        {elevation.openings.map((o, i) => (
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
              <circle cx={o.x + o.w * 0.85} cy={o.y + o.h * 0.55} r={Math.min(o.w, o.h) * 0.04} className="fill-text" />
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
 * Wall tiling scheme (docs/ui/room-plan-and-layout-guides.md): the floor plan for which wall is which, then every
 * wall unfolded as seen from the room, with the tiles the purchase counted.
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
          <Elevation key={e.wall} elevation={e} scale={e.lengthMm / longest} />
        ))}
      </span>
    </span>
  );
}
