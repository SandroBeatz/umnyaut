/** Input from before the `pattern` toggle: a repeat above zero meant a pattern to match. */
export function patternFromRepeat(raw: Readonly<Record<string, unknown>>): Record<string, unknown> {
  if ("pattern" in raw || typeof raw.repeatMm !== "number") return { ...raw };
  return { ...raw, pattern: raw.repeatMm > 0 };
}

/** Stored input brought up to the module's current fields; unchanged when the module has no `upgrade`. */
export function upgradeInput(
  module: { upgrade?(raw: Readonly<Record<string, unknown>>): Record<string, unknown> },
  raw: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return module.upgrade ? module.upgrade(raw) : { ...raw };
}
