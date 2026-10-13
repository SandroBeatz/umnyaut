import { type EstimateCalc, type Surface, type SurfacePart, surfaceParts } from "@umnyaut/calc";
import { shell, type ToolDef } from "@umnyaut/catalog";
import type { ToolValues } from "@/entities/tool";
import { fill } from "@/shared/lib";
import { roomBindings, same } from "./fields";

const t = shell.calcs;

/** The tool's own input to store in its calc: changed fields that are not the room's. */
export function ownInput(tool: ToolDef, values: ToolValues, defaults: ToolValues): Record<string, unknown> {
  const bound = new Set(roomBindings(tool.fields).map(([name]) => name));
  return Object.fromEntries(Object.entries(values).filter(([k, v]) => !bound.has(k) && !same(v, defaults[k])));
}

/** The surface a calc with these values covers (`ToolDef.surface`); none for plinth and area tools. */
export function surfaceOf(tool: ToolDef, values: ToolValues): Surface | undefined {
  if (!tool.surface) return undefined;
  if ("fixed" in tool.surface) return tool.surface.fixed;
  return tool.surface.values[String(values[tool.surface.field])];
}

/** The input that makes a calc of the tool cover `surface` (the select option), for «+ Ещё» and «Разделить». */
export function surfaceInput(tool: ToolDef, surface: Surface): ToolValues {
  if (!tool.surface || "fixed" in tool.surface) return {};
  const option = Object.entries(tool.surface.values).find(([, s]) => s === surface)?.[0];
  return option === undefined ? {} : { [tool.surface.field]: option };
}

/** The select option label of the calc's surface («Стены», «Стены и потолок»). */
function surfaceLabel(tool: ToolDef, calc: EstimateCalc): string | undefined {
  if (!tool.surface || "fixed" in tool.surface || !calc.surface) return undefined;
  const field = tool.fields.find((f) => f.kind === "select" && f.name === (tool.surface as { field: string }).field);
  const value = Object.entries(tool.surface.values).find(([, s]) => s === calc.surface)?.[0];
  return field?.kind === "select" ? field.options.find((o) => o.value === value)?.label : undefined;
}

/**
 * «Стены · белая», «белая», «Стены»; a tool with one fixed surface names it, numbered from the second calc («Пол»,
 * «Пол 2»); else «Расчёт 2» by its place among the tool's calcs.
 */
export function chipLabel(tool: ToolDef, calc: EstimateCalc, index: number): string {
  const fixed = tool.surface && "fixed" in tool.surface ? partsLabel(surfaceParts(tool.surface.fixed)) : undefined;
  const surface = surfaceLabel(tool, calc) ?? (fixed && index > 0 ? `${fixed} ${index + 1}` : fixed);
  const parts = [surface, calc.label?.trim() || undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : fill(t.unnamed, { n: index + 1 });
}

/** «+ Ещё»: the first surface option no calc of the tool covers yet, else the first option. */
export function nextSurface(tool: ToolDef, calcs: readonly EstimateCalc[]): ToolValues {
  if (!tool.surface || "fixed" in tool.surface) return {};
  const taken = new Set(calcs.flatMap((c) => (c.surface ? surfaceParts(c.surface) : [])));
  const options = Object.entries(tool.surface.values);
  const free = options.find(([, s]) => surfaceParts(s).every((p) => !taken.has(p))) ?? options[0];
  return free ? { [tool.surface.field]: free[0] } : {};
}

/** A tool lays a finish: it covers a surface with a material of its own (not adhesive or grout). */
const finishes = (tool: ToolDef | undefined) =>
  Boolean(tool?.surface && Object.values(tool.items ?? {}).some((item) => !item.shared));

export interface CalcOverlap {
  parts: readonly SurfacePart[];
  /** «Плитка: Пол и стены». */
  calc: string;
  /** Same tool, one of the two covers two surfaces: split it into one calc per surface. */
  split?: { id: string; surfaces: readonly [Surface, Surface] };
}

/**
 * A finish of the room that covers the same surface as the current calc (tile on «Пол и стены» and on «Пол»,
 * wallpaper and paint on the walls) for the warning under the result: one that can be split first, else the first found.
 */
export function overlapOf(
  current: EstimateCalc | undefined,
  calcs: readonly EstimateCalc[],
  tools: readonly ToolDef[],
): CalcOverlap | undefined {
  const toolOf = (id: string) => tools.find((tool) => tool.id === id);
  if (!current?.surface || !finishes(toolOf(current.tool))) return undefined;
  const found: CalcOverlap[] = [];
  for (const other of calcs) {
    if (other.id === current.id || other.roomId !== current.roomId || !other.surface) continue;
    const otherTool = toolOf(other.tool);
    if (!otherTool || !finishes(otherTool)) continue;
    const mine = surfaceParts(current.surface);
    const parts = surfaceParts(other.surface).filter((p) => mine.includes(p));
    if (parts.length === 0) continue;
    const index = calcs.filter((c) => c.tool === other.tool).indexOf(other);
    const both = [current, other].find((c) => c.surface && surfaceParts(c.surface).length === 2);
    const halves = both?.surface ? (surfaceParts(both.surface) as readonly SurfacePart[]) : [];
    found.push({
      parts,
      calc: `${otherTool.title}: ${chipLabel(otherTool, other, index)}`,
      ...(other.tool === current.tool && both && halves.length === 2
        ? { split: { id: both.id, surfaces: [halves[0] as Surface, halves[1] as Surface] as const } }
        : {}),
    });
  }
  // One the user can fix right here («Разделить») goes first.
  return found.find((o) => o.split) ?? found[0];
}

/** «Пол», «Пол и стены». */
export const partsLabel = (parts: readonly SurfacePart[]) =>
  parts.map((p, i) => (i === 0 ? t.parts[p] : t.parts[p].toLowerCase())).join(" и ");
