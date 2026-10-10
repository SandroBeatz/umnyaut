// Reviewer handout (plan P6.10, content plan C10): every golden example of the live tools as a Russian
// Markdown page a practising master reads without code — parameters by field label, our answer in packs,
// the hand derivation with its source, Qalculator observations and the open questions.
//   pnpm review:export                → docs/review/wave-1-master.md
//   pnpm review:export --out file.md
import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type GoldenFile, runExample } from "../../packages/calc/src/golden";
import { toolModules } from "../../packages/calc/src/tools";
import type { PurchaseItem, ToolModule, ToolResult } from "../../packages/calc/src/types";
import { getNorm, packNouns, type ToolDef, tools, unitLabels } from "../../packages/catalog/src/index";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const num = (n: number, digits = 3) => String(Math.round(n * 10 ** digits) / 10 ** digits).replace(".", ",");

function plural(n: number, [one, few, many]: readonly [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (!Number.isInteger(n)) return few;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

/** One parameter in the master's terms: «Длина комнаты 5 м», «Укладка: Диагональ», «Окна и двери: дверь 0,8 × 2 м». */
function describeValue(tool: ToolDef, name: string, value: unknown): string {
  const field = tool.fields.find((f) => "name" in f && f.name === name);
  const label = field && "label" in field ? field.label : name;
  if (field?.kind === "length" && typeof value === "number") {
    return field.unit === "m" ? `${label} ${num(value / 1000)} м` : `${label} ${num(value / 10, 1)} см`;
  }
  if (field?.kind === "select") {
    const option = field.options.find((o) => o.value === String(value));
    return `${label}: ${option?.label ?? String(value)}`;
  }
  if (field?.kind === "toggle") return `${label}: ${value ? "да" : "нет"}`;
  if (field?.kind === "number" && typeof value === "number")
    return `${label} ${num(value)}${field.unit ? ` ${field.unit}` : ""}`;
  if (field?.kind === "openings" && Array.isArray(value)) {
    if (value.length === 0) return `${label}: нет`;
    const rows = value.map((o: { type: string; widthMm: number; heightMm: number; count: number }) => {
      const kind = o.type === "door" ? "дверь" : "окно";
      return `${kind} ${num(o.widthMm / 1000)} × ${num(o.heightMm / 1000)} м${o.count === 1 ? "" : ` × ${o.count}`}`;
    });
    return `${label}: ${rows.join(", ")}`;
  }
  if (name === "cansMl" && Array.isArray(value)) return `Банки: ${value.map((ml) => num(ml / 1000)).join(" / ")} л`;
  return `${label} = ${JSON.stringify(value)}`;
}

function describeInput(tool: ToolDef, module: ToolModule<unknown>, input: Record<string, unknown>): string {
  const defaults = module.defaults({ country: "RU" }) as Record<string, unknown>;
  const changed = Object.entries(input).filter(([k, v]) => JSON.stringify(defaults[k]) !== JSON.stringify(v));
  return changed.length === 0 ? "по умолчанию" : changed.map(([k, v]) => describeValue(tool, k, v)).join("; ");
}

/** «Обои — 11 рулонов; Клей — 2 пачки (1 × 9 л + …)»; geometry tools — the first summary number. */
function describeResult(tool: ToolDef, result: ToolResult): string {
  const groups = new Map<string, PurchaseItem[]>();
  for (const item of result.items) groups.set(item.key, [...(groups.get(item.key) ?? []), item]);
  const lines = [...groups.values()].map((lines) => {
    const first = lines[0] as PurchaseItem;
    const packs = lines.reduce((n, l) => n + l.packs, 0);
    const title = tool.items?.[first.key]?.title ?? first.key;
    const sizes =
      lines.length > 1 || first.pack.size.unit === "l" || first.pack.size.unit === "kg"
        ? ` (${lines.map((l) => `${l.packs} × ${num(l.pack.size.value)} ${unitLabels[l.pack.size.unit]}`).join(" + ")})`
        : "";
    if (first.pack.kind === "running" && first.pack.width) {
      const length = lines.reduce((n, l) => n + l.bought.value, 0) / first.pack.width.value;
      return `${title} — ${num(length, 2)} м шириной ${num(first.pack.width.value)} м`;
    }
    return `${title} — ${packs} ${plural(packs, packNouns[first.pack.kind])}${sizes}`;
  });
  if (lines.length > 0) return lines.join("; ");
  const first = result.summary[0];
  return first
    ? `${tool.summary?.[first.key] ?? first.key}: ${num(first.value)} ${unitLabels[first.unit]}`
    : "ничего не покупаем";
}

const warningText = (tool: ToolDef, result: ToolResult) =>
  result.warnings.map((w) =>
    (tool.warnings?.[w.code] ?? w.code).replace(/\{([a-z]+)\}/gi, (_, key: string) => {
      const value = w.values?.[key];
      return value === undefined ? "…" : num(value, 2);
    }),
  );

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");

/** Open questions for the master, by tool id. */
const QUESTIONS: Readonly<Record<string, readonly string[]>> = {
  oboi: [
    "Кусок над окном и под ним считаем одним отрезом из остатка рулона. С крупным рисунком нижний кусок может не совпасть — так ли режут на практике?",
    "Полосы считаем по всему периметру, а не по каждой стене (в комнате 4,6 × 4,3 м: 34 полосы против 36 по стенам). Нужно ли считать по стенам?",
    "Начало рисунка в каждом рулоне считаем неудачным (теряется до раппорта). Это правило «высота + раппорт» — согласны?",
    "Клей: 30 м² на пачку — верх диапазона для тяжёлых флизелиновых. Какую цифру вы берёте?",
    "Запасной рулон не добавляем, только подсказку про партию. Нужно ли добавлять рулон по умолчанию?",
  ],
  kraska: [
    "Расход 10 м²/л на слой при паспортных 12–14 — с запасом на неровные стены. Сколько закладываете вы?",
    "Набор банок выбираем по наименьшему остатку, а не по цене (7,5 л → 3 × 2,7 л, а не одна 9 л). Как правильно?",
  ],
  plintus: [
    "Планок берём ⌈(периметр − двери) / длина⌉, обрезки стыкуем соединителями. Насколько это реально для пластикового плинтуса?",
    "Соединителей = планок − 1. Не много ли?",
    "Крепёж — по одному на каждые 40 см прямого участка и у каждого края. Так?",
  ],
  laminat: [
    "Раскладка рядами: обрезок от конца ряда начинает следующий ряд, обрезок от начала — только заканчивает ряд (замки). Минимальный кусок и смещение стыков 30 см. Совпадает с вашей практикой?",
    "Диагональ и ёлочка: +15 % к площади. Сколько закладываете вы?",
    "Подложка: рулоны по 10 м², без нахлёста. Верно?",
  ],
  linoleum: [
    "Ранжируем варианты: сначала меньше швов, затем меньшая площадь. Правильный порядок?",
    "Нахлёст на шов 5 см, припуск на подрезку по умолчанию 0 (по Tarkett — мерить по наибольшим размерам). Добавляете ли вы запас по длине?",
  ],
  plitka: [
    "Каждый подрезанный кусок — отдельная плитка, остатки не используем, и сверху 10 % запаса. Не слишком ли много?",
    "В проёмах вычитаем только целые плитки, которые точно попадут внутрь. Так считаете?",
  ],
  klej: [
    "Для плитки от 30 × 30 добавляем слой 1 мм на плитку (+1,2 кг/м²). Какую толщину берёте при комбинированном способе?",
    "Зуб 8 мм: 3,6 кг/м² по паспорту CM 11 PRO (в статье Ceresit 3,2 для плитки до 20 см). Что ближе к практике?",
  ],
  zatirka: ["Глубина шва = толщина плитки, плотность 1,6, запас 10 %. Верно для цементной затирки?"],
};

function section(tool: ToolDef, golden: GoldenFile<unknown>): string {
  const module = toolModules[tool.id] as ToolModule<unknown>;
  const norms = (tool.norms ?? [])
    .map((id) => {
      const n = getNorm(id);
      return n
        ? `- ${id}: ${num(n.value)} ${n.unit}${n.unconfirmed ? " (**не подтверждено**)" : ""} — ${n.source}`
        : "";
    })
    .filter(Boolean);
  const rows = golden.examples.map((example, k) => {
    const input = module.input.parse({ ...module.defaults({ country: "RU" }), ...example.input }) as Record<
      string,
      unknown
    >;
    const result = runExample(module, example);
    const notes = warningText(tool, result);
    return `| ${k + 1} | ${cell(describeInput(tool, module, input))} | ${cell(describeResult(tool, result))}${notes.length ? `<br>_${cell(notes.join(" "))}_` : ""} | ${cell(example.source.ref)} |`;
  });
  const benchmarks = (golden.benchmarks ?? []).map(
    (b) => `- «${b.example}» — ${b.site}, ${b.checkedAt}: ${JSON.stringify(b.observed)}. ${b.explanation ?? ""}`,
  );
  const questions = (QUESTIONS[tool.id] ?? []).map((q, k) => `${k + 1}. ${q}`);
  return [
    `## ${tool.title} — /${tool.category}/${tool.id}/ (версия ${module.version})`,
    "",
    tool.outcome ?? "",
    "",
    ...(norms.length ? ["**Нормы и источники**", "", ...norms, ""] : []),
    "| № | Что задано | Наш ответ | Как посчитали и откуда цифры |",
    "|---|---|---|---|",
    ...rows,
    "",
    ...(benchmarks.length ? ["**Сравнение с Qalculator**", "", ...benchmarks, ""] : []),
    ...(questions.length ? ["**Вопросы мастеру**", "", ...questions, ""] : []),
  ].join("\n");
}

async function main() {
  const out = process.argv.includes("--out")
    ? (process.argv[process.argv.indexOf("--out") + 1] as string)
    : join(root, "docs/review/wave-1-master.md");
  const live = tools.filter((t) => t.status === "live");
  const golden: Record<string, GoldenFile<unknown>> = {};
  for (const dir of readdirSync(join(root, "packages/calc/src/tools"))) {
    if (!live.some((t) => t.id === dir)) continue;
    golden[dir] = (
      (await import(join(root, "packages/calc/src/tools", dir, "golden.ts"))) as { golden: GoldenFile<unknown> }
    ).golden;
  }
  const total = Object.values(golden).reduce((n, g) => n + g.examples.length, 0);
  const page = [
    "# Умняут — примеры первой волны для проверки мастером",
    "",
    `Сгенерировано ${new Date().toISOString().slice(0, 10)} командой \`pnpm review:export\`. Калькуляторов: ${live.length}, примеров: ${total}.`,
    "",
    "Как читать: в каждой строке — что задано (остальное по умолчанию: комната 4,6 × 4,3 м, потолок 2,7 м, дверь 0,8 × 2 м и окно 1,2 × 1,4 м), что посоветует калькулятор и как мы это посчитали вручную. Пожалуйста, отметьте строки, где на практике купили бы иначе, и ответьте на вопросы в конце каждого раздела. Ваши поправки станут новыми контрольными примерами.",
    "",
    ...live.flatMap((t) => (golden[t.id] ? [section(t, golden[t.id] as GoldenFile<unknown>)] : [])),
  ].join("\n");
  writeFileSync(out, page);
  console.log(`wrote ${out}: ${live.length} tools, ${total} examples`);
}

await main();
