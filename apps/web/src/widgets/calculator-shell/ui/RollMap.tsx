import type { LayoutRoll } from "@umnyaut/calc";
import { schemeStrings } from "@umnyaut/catalog";
import { useId } from "react";
import { fill } from "@/shared/lib";

const t = schemeStrings.strips.walls;

/**
 * One roll of the wallpaper cutting map, unrolled left to right: strips and pieces where they are cut (a piece
 * from a rest hatched), the rests left for later (dashed) and the waste (the sunken background).
 */
export function RollMap({ roll, widthMm, lengthMm }: { roll: LayoutRoll; widthMm: number; lengthMm: number }) {
  const hatch = useId();
  const font = Math.min(widthMm * 0.55, 260);
  return (
    <svg viewBox={`0 0 ${lengthMm} ${widthMm}`} aria-hidden="true" className="mb-1 h-auto w-full">
      <defs>
        <pattern id={hatch} patternUnits="userSpaceOnUse" width={60} height={60} patternTransform="rotate(45)">
          <rect width={60} height={60} className="fill-primary-soft" />
          <line x1={0} y1={0} x2={0} y2={60} strokeWidth={18} className="stroke-primary" />
        </pattern>
      </defs>
      <rect width={lengthMm} height={widthMm} className="fill-surface-sunken" />
      {roll.rests.map((r, i) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: rests are positional
          key={`r${i}`}
          x={r.fromMm}
          y={r.xMm}
          width={r.lengthMm}
          height={r.widthMm}
          vectorEffect="non-scaling-stroke"
          strokeWidth={1}
          strokeDasharray="4 3"
          className="fill-surface-mint stroke-text-subtle"
        />
      ))}
      {roll.cuts.map((c, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: cuts are positional
        <g key={`c${i}`}>
          <rect
            x={c.fromMm}
            y={c.xMm}
            width={c.lengthMm}
            height={c.widthMm}
            fill={c.fromRest ? `url(#${hatch})` : undefined}
            vectorEffect="non-scaling-stroke"
            strokeWidth={1}
            className={c.fromRest ? "stroke-text-subtle" : "fill-surface stroke-text"}
          />
          <text
            x={c.fromMm + c.lengthMm / 2}
            y={c.xMm + c.widthMm / 2}
            fontSize={Math.min(font, c.widthMm * 0.7, c.lengthMm * 0.35)}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-text"
          >
            {c.piece !== undefined ? fill(t.pieceMark, { n: c.piece }) : c.also ? `${c.strip}·${c.also}` : c.strip}
          </text>
        </g>
      ))}
    </svg>
  );
}
