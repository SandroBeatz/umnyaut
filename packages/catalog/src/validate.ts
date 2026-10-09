import type { ToolModule } from "@umnyaut/calc";
import type { CategoryDef } from "./categories";
import type { Norm } from "./norms";
import type { ToolDef } from "./tools/types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Phone first screen budget (design spec §12): at most four main fields. */
export const MAX_MAIN_FIELDS = 4;

export interface RegistryInput {
  categories: readonly CategoryDef[];
  reservedSegments: readonly string[];
  tools: readonly ToolDef[];
  modules: Readonly<Record<string, Pick<ToolModule, "id" | "version">>>;
  norms: Readonly<Record<string, Norm>>;
}

const duplicates = (values: readonly string[]) => [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];

/** Every rule of plan P4.7 that can be checked inside the catalog; content files are checked in apps/web. */
export function validateRegistry({ categories, reservedSegments, tools, modules, norms }: RegistryInput): string[] {
  const errors: string[] = [];
  const slugs = categories.map((c) => c.slug);
  for (const slug of duplicates(slugs)) errors.push(`category ${slug}: duplicate slug`);
  for (const slug of slugs) {
    if (!SLUG.test(slug)) errors.push(`category ${slug}: malformed slug`);
    if (reservedSegments.includes(slug)) errors.push(`category ${slug}: reserved URL segment`);
  }

  const ids = tools.map((t) => t.id as string);
  for (const id of duplicates(ids)) errors.push(`tool ${id}: duplicate id (URL)`);
  for (const id of Object.keys(modules)) if (!ids.includes(id)) errors.push(`module ${id}: missing from the catalog`);

  for (const tool of tools) {
    const at = `tool ${tool.id}`;
    if (!SLUG.test(tool.id)) errors.push(`${at}: malformed id`);
    if (!slugs.includes(tool.category)) errors.push(`${at}: unknown category ${tool.category}`);
    const module = modules[tool.id];
    if (!module) errors.push(`${at}: no calc module`);
    else if (tool.status === "live" && module.version < 1) errors.push(`${at}: live without a formula (version 0)`);

    for (const next of tool.nextSteps ?? []) {
      if (next === tool.id) errors.push(`${at}: next step points to itself`);
      else if (!ids.includes(next)) errors.push(`${at}: next step ${next} does not exist`);
    }

    const main = tool.fields.filter((f) => f.main).length;
    if (main > MAX_MAIN_FIELDS) errors.push(`${at}: ${main} main fields, at most ${MAX_MAIN_FIELDS}`);
    const names = tool.fields.flatMap((f) => ("name" in f ? [f.name] : []));
    for (const name of duplicates(names)) errors.push(`${at}: duplicate field ${name}`);
    for (const field of tool.fields) {
      if (!("when" in field) || !field.when) continue;
      for (const key of Object.keys(field.when)) {
        if (!names.includes(key)) errors.push(`${at}: field ${field.name} depends on unknown field ${key}`);
      }
    }

    const presetIds = (tool.presets ?? []).map((p) => p.id);
    for (const id of duplicates(presetIds)) errors.push(`${at}: duplicate preset ${id}`);
    for (const field of tool.fields) {
      if (field.kind !== "preset") continue;
      for (const id of field.presets) if (!presetIds.includes(id)) errors.push(`${at}: unknown preset ${id}`);
    }
    for (const preset of tool.presets ?? []) {
      for (const key of Object.keys(preset.values)) {
        if (!names.includes(key)) errors.push(`${at}: preset ${preset.id} sets unknown field ${key}`);
      }
    }
    for (const id of tool.norms ?? []) if (!norms[id]) errors.push(`${at}: unknown norm ${id}`);
  }

  for (const [id, norm] of Object.entries(norms)) {
    if (!norm.source.trim()) errors.push(`norm ${id}: missing source`);
    if (!DATE.test(norm.checkedAt)) errors.push(`norm ${id}: checkedAt must be YYYY-MM-DD`);
    if (!Number.isFinite(norm.value)) errors.push(`norm ${id}: value is not a number`);
  }
  return errors;
}
