import { type EstimateCalc, type Surface, type SurfacePart, surfaceParts } from "@umnyaut/calc";
import { type FieldDef, shell, type ToolDef } from "@umnyaut/catalog";
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

/** «Стены · белая», «белая», «Стены», or «Расчёт 2» by its place among the tool's calcs. */
export function chipLabel(tool: ToolDef, calc: EstimateCalc, index: number): string {
  const parts = [surfaceLabel(tool, calc), calc.label?.trim() || undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : fill(t.unnamed, { n: index + 1 });
}

/**
 * Several calcs in a room only for a tool with a surface choice (tile, adhesive, grout, paint), one per surface
 * (owner, 2026-10-13); laminate, linoleum, plinth and wallpaper keep one.
 */
export const manyCalcs = (tool: ToolDef) => Boolean(tool.surface && "field" in tool.surface);

/** «+ Ещё»: the input of the first surface option no calc of the tool covers yet; none when all are covered. */
export function nextSurface(tool: ToolDef, calcs: readonly EstimateCalc[]): ToolValues | undefined {
  if (!tool.surface || !("field" in tool.surface)) return undefined;
  const taken = new Set(calcs.flatMap((c) => (c.surface ? surfaceParts(c.surface) : [])));
  const free = Object.entries(tool.surface.values).find(([, s]) => surfaceParts(s).every((p) => !taken.has(p)));
  return free ? { [tool.surface.field]: free[0] } : undefined;
}

/** A tool lays a finish: it covers a surface with a material of its own (not adhesive or grout). */
const finishes = (tool: ToolDef | undefined) =>
  Boolean(tool?.surface && Object.values(tool.items ?? {}).some((item) => !item.shared));

export interface CalcOverlap {
  parts: readonly SurfacePart[];
  /** «Плитка: Пол и стены». */
  calc: string;
  /** A consumable counted twice on `parts` («Плиточный клей»): a calc of its own beside a finish that brings it. */
  item?: string;
  /** Same tool, one of the two covers two surfaces: split it into one calc per surface. */
  split?: { id: string; surfaces: readonly [Surface, Surface] };
}

/** Item keys of a consumable-only tool (adhesive, grout), whose calc can stand beside a finish bringing the same. */
const consumables = (tool: ToolDef | undefined) =>
  tool?.surface && !finishes(tool) ? Object.keys(tool.items ?? {}) : [];

/** The finish calc brings the consumable: the tool has the item and its group is not switched off in the calc. */
function brings(tool: ToolDef, calc: EstimateCalc, key: string): boolean {
  if (!tool.items?.[key]) return false;
  const price = tool.fields.find(
    (f): f is Extract<FieldDef, { kind: "price" }> => f.kind === "price" && f.item === key,
  );
  const group = price?.group;
  const toggle = tool.groups?.find((g) => g.id === group)?.toggle;
  return !toggle || calc.input[toggle] !== false;
}

/**
 * A consumable calc (adhesive on «Пол») and a finish of the room that brings the same consumable on more than it
 * («Плитка: Пол и стены»): the estimate keeps both, so the shared part counts twice (`aggregateEstimate` overlaps).
 * When the room's calcs of that consumable cover the finish whole, the estimate replaces it: no overlap.
 */
function consumableOverlap(
  current: EstimateCalc,
  calcs: readonly EstimateCalc[],
  toolOf: (id: string) => ToolDef | undefined,
): CalcOverlap | undefined {
  for (const other of calcs) {
    if (other.id === current.id || other.roomId !== current.roomId || !other.surface || !current.surface) continue;
    const [own, finish] = consumables(toolOf(current.tool)).length > 0 ? [current, other] : [other, current];
    const finishTool = toolOf(finish.tool);
    if (!finishTool || !finishes(finishTool) || !own.surface || !finish.surface) continue;
    const key = consumables(toolOf(own.tool)).find((k) => brings(finishTool, finish, k));
    if (!key) continue;
    const parts = surfaceParts(finish.surface).filter((p) => surfaceParts(own.surface as Surface).includes(p));
    if (parts.length === 0) continue;
    const covered = new Set(
      calcs
        .filter((c) => c.roomId === finish.roomId && c.surface && consumables(toolOf(c.tool)).includes(key))
        .flatMap((c) => surfaceParts(c.surface as Surface)),
    );
    if (surfaceParts(finish.surface).every((p) => covered.has(p))) continue;
    const otherTool = toolOf(other.tool);
    if (!otherTool) continue;
    const index = calcs.filter((c) => c.tool === other.tool).indexOf(other);
    return {
      parts,
      calc: `${otherTool.title}: ${chipLabel(otherTool, other, index)}`,
      item: finishTool.items?.[key]?.title ?? key,
    };
  }
  return undefined;
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
  if (!current?.surface) return undefined;
  if (!finishes(toolOf(current.tool))) return consumableOverlap(current, calcs, toolOf);
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
  // One the user can fix right here («Разделить») goes first; else a finish, else a consumable counted twice.
  return found.find((o) => o.split) ?? found[0] ?? consumableOverlap(current, calcs, toolOf);
}

/** «Пол», «Пол и стены». */
export const partsLabel = (parts: readonly SurfacePart[]) =>
  parts.map((p, i) => (i === 0 ? t.parts[p] : t.parts[p].toLowerCase())).join(t.and);
