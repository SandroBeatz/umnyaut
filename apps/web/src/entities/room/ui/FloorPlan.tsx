import type { LayoutMark, PlanWall } from "@umnyaut/calc";
import { formatNumber, NBSP } from "@umnyaut/ui/format";
import { type ReactNode, useId } from "react";

export interface FloorPlanProps {
  /** Room contour in mm, plan frame (x along the length, y along the width down), clockwise. */
  outline: readonly (readonly [number, number])[];
  walls: readonly PlanWall[];
  /** Doors, windows, the start corner. */
  marks?: readonly LayoutMark[];
  /** Units after the dimensions («м»). */
  unit: string;
  /** Text alternative: «План комнаты 4,6 × 4,3 м». */
  label: string;
  /** «Старт» next to the start mark. */
  startLabel?: string;
  /** Drawn inside the room, clipped to its contour (layout pieces). */
  children?: ReactNode;
  className?: string;
}

type Point = readonly [number, number];

/**
 * Top-down plan of “My room” (docs/ui/room-plan-and-layout-guides.md): contour (L-shapes too), wall numbers
 * clockwise from the top-left corner, overall dimensions, doors with their swing, windows as a double line.
 * Drawn in mm; line widths do not scale. The layout scheme draws its pieces inside as `children`.
 */
export function FloorPlan({
  outline,
  walls,
  marks = [],
  unit,
  label,
  startLabel,
  children,
  className,
}: FloorPlanProps) {
  const clip = useId();
  const width = Math.max(...outline.map(([x]) => x));
  const height = Math.max(...outline.map(([, y]) => y));
  const size = Math.max(width, height);
  const pad = size * 0.14;
  const font = size * 0.045;
  const badge = font * 0.95;
  const d = `M${outline.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
  const text = (mm: number) => `${formatNumber(mm / 1000, { maxFraction: 2 })}${NBSP}${unit}`;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${width + 2 * pad} ${height + 2 * pad}`}
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} className="fill-surface" />
      <g clipPath={`url(#${clip})`}>{children}</g>
      <path d={d} fill="none" vectorEffect="non-scaling-stroke" className="stroke-text" strokeWidth={2} />

      {marks.map((m, i) => {
        if (m.kind === "door") {
          // Leaf swings into the room: quarter circle from the hinge end.
          const w = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
          const ux = (m.x2 - m.x1) / w;
          const uy = (m.y2 - m.y1) / w;
          // Inside is to the right of a clockwise wall in the plan frame (y down).
          const nx = -uy;
          const ny = ux;
          const leaf: Point = [m.x1 + nx * w, m.y1 + ny * w];
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: marks have no id; the list is rebuilt on every change
            <g key={i}>
              <line
                x1={m.x1}
                y1={m.y1}
                x2={m.x2}
                y2={m.y2}
                vectorEffect="non-scaling-stroke"
                strokeWidth={4}
                className="stroke-surface"
              />
              <line
                x1={m.x1}
                y1={m.y1}
                x2={leaf[0]}
                y2={leaf[1]}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1.5}
                className="stroke-text"
              />
              <path
                d={`M${leaf[0]} ${leaf[1]}A${w} ${w} 0 0 0 ${m.x2} ${m.y2}`}
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
                strokeDasharray="4 3"
                className="stroke-text-muted"
              />
            </g>
          );
        }
        if (m.kind === "window") {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: marks have no id; the list is rebuilt on every change
            <g key={i}>
              <line
                x1={m.x1}
                y1={m.y1}
                x2={m.x2}
                y2={m.y2}
                vectorEffect="non-scaling-stroke"
                strokeWidth={7}
                className="stroke-primary"
              />
              <line
                x1={m.x1}
                y1={m.y1}
                x2={m.x2}
                y2={m.y2}
                vectorEffect="non-scaling-stroke"
                strokeWidth={3}
                className="stroke-surface"
              />
            </g>
          );
        }
        if (m.kind === "start") {
          const len = Math.hypot(m.x2 - m.x1, m.y2 - m.y1) || 1;
          const ux = (m.x2 - m.x1) / len;
          const uy = (m.y2 - m.y1) / len;
          const head = font * 0.6;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: marks have no id; the list is rebuilt on every change
            <g key={i} className="text-primary">
              <circle cx={m.x1} cy={m.y1} r={font * 0.35} className="fill-primary" />
              <line
                x1={m.x1}
                y1={m.y1}
                x2={m.x2}
                y2={m.y2}
                vectorEffect="non-scaling-stroke"
                strokeWidth={2.5}
                className="stroke-primary"
              />
              <path
                d={`M${m.x2} ${m.y2}L${m.x2 - ux * head - uy * head * 0.6} ${m.y2 - uy * head + ux * head * 0.6}L${m.x2 - ux * head + uy * head * 0.6} ${m.y2 - uy * head - ux * head * 0.6}Z`}
                className="fill-primary"
              />
              {startLabel ? (
                // Outside the contour next to the start corner, clear of the pieces and the row numbers.
                <text
                  x={m.x1}
                  y={m.y1 > height / 2 ? height + badge * 1.4 : -badge * 1.4}
                  fontSize={font * 0.85}
                  dominantBaseline="central"
                  textAnchor={m.x1 > width / 2 ? "end" : "start"}
                  className="fill-primary font-semibold"
                >
                  {startLabel}
                </text>
              ) : null}
            </g>
          );
        }
        return null;
      })}

      {walls.map((w, i) => {
        // Outward normal of a clockwise wall (y down) is (dy, −dx).
        const nx = Math.sign(w.y2 - w.y1);
        const ny = -Math.sign(w.x2 - w.x1);
        const cx = (w.x1 + w.x2) / 2 + nx * badge * 1.4;
        const cy = (w.y1 + w.y2) / 2 + ny * badge * 1.4;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: walls are positional
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={badge}
              className="fill-surface-sunken stroke-border-input"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={cx}
              y={cy}
              fontSize={font}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-text font-semibold"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      <g className="fill-primary-hover" fontSize={font * 0.9}>
        {/* Overall size next to the numbers of the top and the left wall; the corners stay free for «Старт». */}
        <text x={width / 2 + badge * 1.8} y={-badge * 1.4} dominantBaseline="central" textAnchor="start">
          {text(width)}
        </text>
        <text
          x={-badge * 1.4}
          y={height / 2 + badge * 1.8}
          dominantBaseline="central"
          textAnchor="end"
          transform={`rotate(-90 ${-badge * 1.4} ${height / 2 + badge * 1.8})`}
        >
          {text(height)}
        </text>
      </g>
    </svg>
  );
}
