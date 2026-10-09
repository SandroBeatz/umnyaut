// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Contrast pairs from the design spec §5 «Проверенный контраст», read from the real token values.
const css = readFileSync(new URL("./theme.css", import.meta.url), "utf8");

function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}
const light = tokens(css.slice(css.indexOf("@theme static"), css.indexOf("}", css.indexOf("@theme static"))));
const dark = { ...light, ...tokens(css.slice(css.indexOf('[data-theme="dark"]'))) };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return ((x ?? 0) + 0.05) / ((y ?? 0) + 0.05);
}

type Pair = [fg: string, bg: string, min: number];
const lightPairs: Pair[] = [
  ["text", "surface", 4.5],
  ["text-muted", "surface", 4.5],
  ["text-muted", "surface-mint", 4.5],
  ["text-subtle", "surface", 4.5],
  ["on-primary", "primary", 4.5],
  ["primary", "surface", 4.5],
  ["primary-hover", "surface-mint", 4.5],
  ["primary-hover", "primary-soft", 4.5],
  ["on-accent", "accent", 4.5],
  ["on-accent", "accent-hover", 4.5],
  ["accent-text", "surface", 4.5],
  ["accent-text", "accent-soft", 4.5],
  ["danger", "surface", 4.5],
  ["danger", "danger-soft", 4.5],
  ["border-input", "surface", 3],
  ["focus", "surface", 3],
];
const darkPairs: Pair[] = [
  ["text", "surface", 4.5],
  ["text-muted", "surface", 4.5],
  ["on-primary", "primary", 4.5],
  ["on-accent", "accent", 4.5],
  ["primary", "surface", 4.5],
];

describe("theme contrast", () => {
  it.each(lightPairs)("light: %s on %s ≥ %d", (fg, bg, min) => {
    expect(light[fg], fg).toBeDefined();
    expect(contrast(light[fg] as string, light[bg] as string)).toBeGreaterThanOrEqual(min);
  });
  it.each(darkPairs)("dark: %s on %s ≥ %d", (fg, bg, min) => {
    expect(contrast(dark[fg] as string, dark[bg] as string)).toBeGreaterThanOrEqual(min);
  });
  it("white on orange stays forbidden (2.67)", () => {
    expect(contrast("#ffffff", light.accent as string)).toBeLessThan(3);
  });
});
