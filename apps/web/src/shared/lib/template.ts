import { NBSP, plural } from "@umnyaut/ui/format";

/** «2,5» or «1 200» as a catalog value shows it → 2.5, 1200; NaN for anything else. */
const parseShown = (shown: string) => Number(shown.replace(/[\s  ]/g, "").replace(",", "."));

/**
 * Replaces `{name}` in a catalog string; unknown names stay as they are. `{name|полоса|полосы|полос}` adds the
 * word in the form for the value: «3 полосы», «5 полос», «2,5 пачки».
 */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(
    /\{(\w+)(?:\|([^|{}]+)\|([^|{}]+)\|([^|{}]+))?\}/g,
    (match, name: string, one?: string, few?: string, many?: string) => {
      if (!(name in values)) return match;
      const shown = String(values[name]);
      if (one === undefined || few === undefined || many === undefined) return shown;
      const count = typeof values[name] === "number" ? (values[name] as number) : parseShown(shown);
      return `${shown}${NBSP}${Number.isFinite(count) ? plural(count, { one, few, many }) : many}`;
    },
  );
}
