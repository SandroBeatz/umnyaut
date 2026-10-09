import { fromBase64Url, toBase64Url } from "@/shared/lib";

type Values = Readonly<Record<string, unknown>>;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Only fields that differ from the tool's defaults go into `?s=` (tech spec §6 «Отправка без сервера»). */
export function encodeShare(values: Values, defaults: Values): string | undefined {
  const changed = Object.fromEntries(Object.entries(values).filter(([key, value]) => !same(value, defaults[key])));
  return Object.keys(changed).length > 0 ? toBase64Url(JSON.stringify(changed)) : undefined;
}

/** The changed fields from `?s=`, or `undefined` for anything that is not a JSON object. Not validated here. */
export function decodeShare(param: string | null | undefined): Record<string, unknown> | undefined {
  if (!param) return undefined;
  const json = fromBase64Url(param);
  if (json === undefined) return undefined;
  try {
    const value: unknown = JSON.parse(json);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/** Absolute share link: the clean page URL plus `?s=` when anything differs from the defaults. */
export function shareUrl(pageUrl: string, values: Values, defaults: Values): string {
  const url = new URL(pageUrl);
  url.search = "";
  url.hash = "";
  const s = encodeShare(values, defaults);
  if (s) url.searchParams.set("s", s);
  return url.toString();
}
