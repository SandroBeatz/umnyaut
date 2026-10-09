/** Parsing for NumberField: accepts «4,6», «4.6», «1 200,5», «4,6 м» (pasted), «−2». */
export function parseDecimal(text: string): number | null {
  const cleaned = text
    .replace(/[\s   ]/g, "")
    .replace(/[−–]/g, "-")
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/** Text shown in the field: decimal comma, no grouping (grouping makes editing awkward). */
export function displayDecimal(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "";
  return String(Number(value.toFixed(6)))
    .replace(".", ",")
    .replace("-", "−");
}

/** Keystroke filter: digits, one separator, leading minus. Spaces from paste are kept until blur. */
export function sanitiseTyping(text: string, allowNegative: boolean): string {
  let result = text.replace(/\./g, ",").replace(/[^\d,\s  −-]/g, "");
  const first = result.indexOf(",");
  if (first !== -1) result = result.slice(0, first + 1) + result.slice(first + 1).replace(/,/g, "");
  if (!allowNegative) result = result.replace(/[−-]/g, "");
  return result;
}
