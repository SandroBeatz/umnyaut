import { formatNumber, NBSP } from "@umnyaut/ui/format";

export interface RoomSchemeProps {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  /** Units after the numbers («м»). */
  unit: string;
  /** Text alternative: «Схема комнаты 4 × 3 м, высота 2,7 м». */
  label: string;
  className?: string;
}

const VIEW_W = 300;
const VIEW_H = 170;
const PAD = 28;
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
/** Very long or very narrow rooms stay recognisable as a box. */
const MAX_RATIO = 3;
/** Walls are drawn lower than they are, so the floor — what most works cover — reads first. */
const WALL_SCALE = 0.45;

type Point = readonly [number, number];
const path = (points: readonly Point[]) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;

/**
 * Isometric box of “My room” with live dimensions (design spec §13, home «Моя комната»): floor in mint,
 * the two back walls, length and width along the front edges, height on the right corner.
 */
export function RoomScheme({ lengthMm, widthMm, heightMm, unit, label, className }: RoomSchemeProps) {
  const longest = Math.max(lengthMm, widthMm);
  const clamp = (mm: number) => Math.min(Math.max(mm, longest / MAX_RATIO), longest);
  const [l, w, h] = [clamp(lengthMm), clamp(widthMm), clamp(heightMm) * WALL_SCALE];

  // Raw isometric extents: x from −w·cos to l·cos, y from −h to (l + w)·sin.
  const rawW = (l + w) * COS;
  const rawH = h + (l + w) * SIN;
  const k = Math.min((VIEW_W - 2 * PAD) / rawW, (VIEW_H - 2 * PAD) / rawH);
  const ox = (VIEW_W - rawW * k) / 2 + w * COS * k;
  const oy = (VIEW_H - rawH * k) / 2 + h * k;

  const at = (along: number, across: number, up = 0): Point => [
    ox + (along - across) * COS * k,
    oy + (along + across) * SIN * k - up * k,
  ];
  const back = at(0, 0);
  const right = at(l, 0);
  const front = at(l, w);
  const left = at(0, w);
  const up = (p: Point): Point => [p[0], p[1] - h * k];

  const text = (mm: number) => `${formatNumber(mm / 1000, { maxFraction: 2 })}${NBSP}${unit}`;
  const mid = (a: Point, b: Point, dx: number, dy: number): Point => [(a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy];
  const lengthAt = mid(left, front, -10, 18);
  const widthAt = mid(right, front, 10, 18);
  const heightAt: Point = [right[0] + 8, right[1] - (h * k) / 2];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={label} className={className}>
      <path d={path([left, back, up(back), up(left)])} className="fill-surface-sunken stroke-border-input" />
      <path d={path([back, right, up(right), up(back)])} className="fill-surface stroke-border-input" />
      <path d={path([back, right, front, left])} className="fill-surface-mint stroke-primary" strokeWidth={1.5} />
      <line
        x1={right[0]}
        y1={right[1]}
        x2={up(right)[0]}
        y2={up(right)[1]}
        className="stroke-primary"
        strokeWidth={1.5}
      />
      <g className="fill-primary-hover text-[12px] font-semibold tabular-nums">
        <text x={lengthAt[0]} y={lengthAt[1]} textAnchor="end">
          {text(lengthMm)}
        </text>
        <text x={widthAt[0]} y={widthAt[1]} textAnchor="start">
          {text(widthMm)}
        </text>
        <text x={heightAt[0]} y={heightAt[1]} textAnchor="start" dominantBaseline="middle">
          {text(heightMm)}
        </text>
      </g>
    </svg>
  );
}
