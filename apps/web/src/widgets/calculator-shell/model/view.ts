import type { Country, ToolResult } from "@umnyaut/calc";
import { packNouns, shell, type ToolDef, unitLabels } from "@umnyaut/catalog";
import { formatMoney, formatNumber, formatQuantity, NBSP, plural } from "@umnyaut/ui/format";
import { groupPurchases, purchaseTexts, runningLength, setText } from "@/entities/tool";
import { fill } from "@/shared/lib";

const forms = ([one, few, many]: readonly [string, string, string]) => ({ one, few, many });

export interface MainFigure {
  key: string;
  title: string;
  /** Big number: «10», «44,78». */
  value: string;
  /** Next to it: «пачек», «м²». */
  unit: string;
  /** «22,1 м² · останется 2,3 м²». */
  caption?: string;
  photo?: string;
}

export interface ResultView {
  /** Purchase list or a measurement (geometry tools). */
  mode: "buy" | "measure";
  main?: MainFigure;
  /** `detail`: pack sizes of a volume/weight item («по 10 л», «1 × 10 л + 1 × 1 л»), small under the title. */
  related: { key: string; title: string; quantity: string; detail?: string; photo?: string }[];
  tiles: { key: string; label: string; value: string }[];
  total?: { text: string; missing?: string };
  /** Sticky bar: «10 пачек · 12 460 ₽», «44,78 м²». */
  short: string;
  warnings: { code: string; text: string }[];
  steps: string[];
}

const number = (value: number) => formatNumber(value, { maxFraction: 2 });
const stepNumber = (value: number) => formatNumber(value, { maxFraction: 3 });
const texts = (values: Readonly<Record<string, number>> | undefined, format: (n: number) => string) =>
  Object.fromEntries(Object.entries(values ?? {}).map(([k, v]) => [k, format(v)]));

/** Turns codes and numbers from `compute()` into Russian text from the catalog. */
export function describeResult(tool: ToolDef, result: ToolResult, country: Country): ResultView {
  const quantity = (value: number, unit: keyof typeof unitLabels) => `${number(value)}${NBSP}${unitLabels[unit]}`;
  const groups = groupPurchases(result.items);
  const mainGroup = groups.find((g) => g.first.role === "main");
  const mainItem = mainGroup?.first;
  let main: MainFigure | undefined;
  const length = mainGroup ? runningLength(mainGroup) : undefined;
  if (mainGroup && mainItem && length !== undefined && mainItem.pack.width) {
    main = {
      key: mainItem.key,
      title: tool.items?.[mainItem.key]?.title ?? mainItem.key,
      value: number(length),
      unit: unitLabels.m,
      caption: fill(shell.result.running, {
        width: quantity(mainItem.pack.width.value, mainItem.pack.width.unit),
        area: quantity(mainItem.bought.value, mainItem.bought.unit),
      }),
      photo: tool.items?.[mainItem.key]?.photo,
    };
  } else if (mainGroup && mainItem) {
    const leftover = quantity(mainGroup.leftover, mainItem.leftover.unit);
    main = {
      key: mainItem.key,
      title: tool.items?.[mainItem.key]?.title ?? mainItem.key,
      value: formatNumber(mainGroup.packs),
      unit: plural(mainGroup.packs, forms(packNouns[mainItem.pack.kind])),
      caption: mainGroup.sized
        ? fill(shell.result.set, { set: setText(mainGroup.lines), leftover })
        : fill(shell.result.need, { need: quantity(mainGroup.need, mainItem.need.unit), leftover }),
      photo: tool.items?.[mainItem.key]?.photo,
    };
  } else if (result.summary[0]) {
    const first = result.summary[0];
    main = {
      key: first.key,
      title: tool.summary?.[first.key] ?? first.key,
      value: number(first.value),
      unit: unitLabels[first.unit],
    };
  }

  const related = groups
    .filter((g) => g.first.role === "related")
    .map((group) => {
      const { quantity, detail } = purchaseTexts(group);
      return {
        key: group.first.key,
        title: tool.items?.[group.first.key]?.title ?? group.first.key,
        quantity,
        ...(detail ? { detail } : {}),
        photo: tool.items?.[group.first.key]?.photo,
      };
    });

  const tiles = result.summary
    .filter((s) => s.key !== main?.key && tool.summary?.[s.key])
    .map((s) => ({ key: s.key, label: tool.summary?.[s.key] ?? s.key, value: quantity(s.value, s.unit) }));

  let total: ResultView["total"];
  if (result.cost && result.cost.missing.length < result.items.length) {
    const parts = [fill(shell.result.total, { total: formatMoney(result.cost.total, country) })];
    if (result.cost.perM2 !== undefined)
      parts.push(fill(shell.result.perM2, { price: formatMoney(result.cost.perM2, country) }));
    const count = result.cost.missing.length;
    total = {
      text: parts.join(" · "),
      missing:
        count > 0 ? fill(shell.result.missing, { count, positions: plural(count, shell.result.positions) }) : undefined,
    };
  }

  const short = main
    ? [`${main.value}${NBSP}${main.unit}`, ...(total ? [formatMoney(result.cost?.total ?? 0, country)] : [])].join(
        " · ",
      )
    : "";

  return {
    mode: mainItem ? "buy" : "measure",
    main,
    related,
    tiles,
    total,
    short,
    warnings: result.warnings.map((w) => ({
      code: w.code,
      text: fill(tool.warnings?.[w.code] ?? w.code, texts(w.values, number)),
    })),
    steps: result.steps.map((s) => fill(tool.steps?.[s.code] ?? s.code, texts(s.values, stepNumber))),
  };
}

/** «Копировать» / «Отправить»: the result as plain lines. */
export function resultText(tool: ToolDef, view: ResultView): string {
  const lines = [tool.title];
  if (view.main) {
    const caption = view.mode === "buy" && view.main.caption ? ` (${view.main.caption})` : "";
    lines.push(`${view.main.title}: ${view.main.value}${NBSP}${view.main.unit}${caption}`);
  }
  for (const item of view.related)
    lines.push(`${item.title}: ${item.quantity}${item.detail ? ` (${item.detail})` : ""}`);
  for (const tile of view.tiles) lines.push(`${tile.label}: ${tile.value}`);
  if (view.total) lines.push([view.total.text, view.total.missing].filter(Boolean).join(", "));
  return lines.join("\n");
}
