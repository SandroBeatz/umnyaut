import type { Pack, Unit } from "@umnyaut/calc";

/** Russian unit labels for `Quantity.unit`. */
export const unitLabels: Readonly<Record<Unit, string>> = {
  mm: "мм",
  m: "м",
  m2: "м²",
  m3: "м³",
  kg: "кг",
  l: "л",
  pcs: "шт.",
};

/** Units a length field can show (the calc works in mm). */
export const lengthUnitLabels = { m: "м", cm: "см", mm: "мм" } as const;

/** Plural forms [one, few, many] per pack kind for `plural()` in `@umnyaut/ui`. */
export const packNouns: Readonly<Record<Pack["kind"], readonly [string, string, string]>> = {
  pack: ["пачка", "пачки", "пачек"],
  roll: ["рулон", "рулона", "рулонов"],
  bag: ["мешок", "мешка", "мешков"],
  bucket: ["ведро", "ведра", "вёдер"],
  can: ["банка", "банки", "банок"],
  canister: ["канистра", "канистры", "канистр"],
  box: ["коробка", "коробки", "коробок"],
  piece: ["штука", "штуки", "штук"],
  plank: ["планка", "планки", "планок"],
  running: ["отрез", "отреза", "отрезов"],
  tube: ["тюбик", "тюбика", "тюбиков"],
};
