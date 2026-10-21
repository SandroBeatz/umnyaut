import { expect, type Locator, type Page, test } from "@playwright/test";

const ROOM = "/osnova/ploshchad-komnaty/";
const WALLS = "/osnova/ploshchad-sten/";
const WALLPAPER = "/steny/oboi/";
const PAINT = "/steny/kraska/";
const PLINTH = "/pol/plintus/";
const LINOLEUM = "/pol/linoleum/";
const LAMINATE = "/pol/laminat/";
const TILE = "/plitka/plitka/";
const ADHESIVE = "/plitka/klej/";
const GROUT = "/plitka/zatirka/";
/** Visible area of Safari on a 390 × 844 iPhone (design spec §12). */
const FIRST_SCREEN = 660;

const result = (page: Page) => page.locator("[data-result-value]").first();
const s = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

async function type(page: Page, label: string, value: string) {
  const field = page.getByRole("textbox", { name: label });
  await field.fill(value);
  await field.blur();
}

/** Set on a page without rooms the room editor opens by itself (once a visit); tests open it themselves. */

/** Opens the room editor («Указать размеры» or «Изменить»), fills its fields by label, saves. */
async function editRoom(page: Page, sizes: Record<string, string>, more?: (editor: Locator) => Promise<void>) {
  await page.getByRole("button", { name: /^(Изменить|Указать размеры)$/ }).click();
  const editor = page.getByRole("dialog");
  for (const [label, value] of Object.entries(sizes)) {
    const field = editor.getByRole("textbox", { name: label, exact: true });
    await field.fill(value);
    await field.blur();
  }
  await more?.(editor);
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await expect(editor).toBeHidden();
}

test("the result number is on the first phone screen of every tool", async ({ page }) => {
  for (const path of [ROOM, WALLS, WALLPAPER, PAINT, PLINTH, LINOLEUM, LAMINATE, TILE, ADHESIVE, GROUT]) {
    await page.goto(path);
    const box = await result(page).boundingBox();
    expect(box, path).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0), path).toBeLessThanOrEqual(FIRST_SCREEN);
  }
});

test("no tool scrolls sideways on a phone, with every section open", async ({ page }) => {
  const width = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  for (const path of [ROOM, WALLS, WALLPAPER, PAINT, PLINTH, LINOLEUM, LAMINATE, TILE, ADHESIVE, GROUT]) {
    await page.goto(path);
    const more = page.getByRole("button", { name: /Ещё параметры/ });
    if (await more.count()) await more.click();
    await page.locator("summary", { hasText: "Как посчитано" }).click();
    // Closed door and window cards: open them one by one (each click drops one from the list).
    const closed = page.getByRole("button", { name: /^(Дверь|Окно)/, expanded: false });
    while (await closed.count()) await closed.first().click();
    expect(await width(), path).toBeLessThanOrEqual(0);
  }
});

test("without rooms «Указать размеры» opens the editor; its room reaches room area and wall area", async ({ page }) => {
  await page.goto(ROOM);
  // The editor never opens by itself (owner, 2026-10-15: it became the page's LCP).
  await expect(result(page)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Указать размеры" }).click();
  const editor = page.getByRole("dialog", { name: "Новая комната" });
  await expect(editor).toBeVisible();
  // The example's length and width are not offered as the user's.
  await expect(editor.getByRole("textbox", { name: "Длина", exact: true })).toHaveValue("");
  for (const [label, value] of [
    ["Длина", "5"],
    ["Ширина", "4"],
  ] as const) {
    await editor.getByRole("textbox", { name: label, exact: true }).fill(value);
    await editor.getByRole("textbox", { name: label, exact: true }).blur();
  }
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await expect(editor).toBeHidden();
  await expect(result(page)).toHaveText("20");
  await expect(page.getByText("Это пример. Введите свои размеры")).toBeHidden();

  await page
    .getByRole("link", { name: /Площадь стен/ })
    .first()
    .click();
  await expect(page).toHaveURL(WALLS);
  // The page opens with the room: its name and sizes, no editor.
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^5\s×\s4\sм$/);
  // The room was saved without doors and windows: 2 × (5 + 4) × 2,7 = 48,6.
  await expect(result(page)).toHaveText("48,6");

  await editRoom(page, { Высота: "3" });
  await page.goto(ROOM);
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^5\s×\s4\s×\s3\sм$/);
});

test("without a room: the example row and «Указать размеры», no editor on any calculator", async ({ page }) => {
  await page.goto(LAMINATE);
  await expect(page.locator("[data-room-example]")).toHaveText(/^Пример: 4,6\s×\s4,3\sм$/);
  await expect(result(page)).toHaveText("11");

  await page.goto(WALLS);
  await expect(page.getByRole("button", { name: "Указать размеры" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a ?s= link reproduces the result and «Отправить» builds one", async ({ page, context }) => {
  const openings = [
    { type: "door", widthMm: 900, heightMm: 2050, count: 1 },
    { type: "window", widthMm: 1500, heightMm: 1500, count: 2 },
  ];
  await page.goto(`${WALLS}?s=${s({ lengthMm: 5000, widthMm: 4000, openings })}`);
  await expect(result(page)).toHaveText("42,26");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/osnova\/ploshchad-sten\/$/);

  // No room yet: the row shows the link's sizes, the editor starts from them.
  await expect(page.locator("[data-room-example]")).toHaveText(/^5\s×\s4\s×\s2,7\sм$/);
  await editRoom(page, { Высота: "3" });
  await expect(result(page)).toHaveText("47,66");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText("Ссылка скопирована")).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("?s=");

  const fresh = await context.browser()?.newContext({ viewport: { width: 390, height: 844 } });
  const other = await fresh?.newPage();
  if (!other) throw new Error("no second page");
  await other.goto(link);
  await expect(result(other)).toHaveText("47,66");
  await fresh?.close();
});

test("a ?s= link keeps its sizes over a room saved on this phone", async ({ page }) => {
  await page.goto(WALLS);
  await editRoom(page, { Длина: "3", Ширина: "4" });
  await page.waitForFunction(() => Object.values(localStorage).some((v) => v.includes('"lengthMm":3000')));
  const openings = [
    { type: "door", widthMm: 900, heightMm: 2050, count: 1 },
    { type: "window", widthMm: 1500, heightMm: 1500, count: 2 },
  ];
  await page.goto(`${WALLS}?s=${s({ lengthMm: 5000, widthMm: 4000, openings })}`);
  await expect(result(page)).toHaveText("42,26");
  // The stored room loads after the link; the result stays the link's.
  await page.waitForTimeout(500);
  await expect(result(page)).toHaveText("42,26");
});

test("an L-shaped room shows the cut-out fields and subtracts the corner", async ({ page }) => {
  await page.goto(ROOM);
  // Shape and cut-out are the room's: the form has none of them.
  await expect(page.getByRole("textbox", { name: "Длина выреза" })).toHaveCount(0);
  await editRoom(page, { Длина: "6", Ширина: "4" }, async (editor) => {
    await editor.getByRole("radio", { name: "Г-образная" }).click();
    for (const [label, value] of [
      ["Вырез по длине", "2"],
      ["Вырез по ширине", "1,5"],
    ] as const) {
      await editor.getByRole("textbox", { name: label }).fill(value);
      await editor.getByRole("textbox", { name: label }).blur();
    }
  });
  await expect(result(page)).toHaveText("21");
});

test("an invalid field keeps the last result and says so", async ({ page }) => {
  await page.goto(WALLPAPER);
  await page.getByRole("button", { name: /Ещё параметры/ }).click();
  await page.getByRole("checkbox", { name: "Рисунок нужно совмещать" }).check();
  const before = await result(page).textContent();
  await type(page, "Раппорт", "500");
  await expect(page.getByRole("textbox", { name: "Раппорт" })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("По прошлым значениям")).toBeVisible();
  await expect(result(page)).toHaveText(before ?? "");
});

test("the sticky bar shows the result once the panel scrolls away", async ({ page }) => {
  await page.goto(WALLS);
  const bar = page.getByRole("link", { name: /К результату/ });
  await expect(bar).toBeHidden();
  await page.getByRole("heading", { name: "Вопросы и ответы" }).scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
  await expect(bar).toContainText("44,78");
  await bar.click();
  await expect(page.locator("#result")).toBeInViewport();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the server HTML already has the numbers", async ({ page }) => {
    await page.goto(WALLS);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(result(page)).toHaveText("44,78");
  });
});

test("wallpaper: rolls by strips, roll preset and pattern repeat change the count", async ({ page }) => {
  await page.goto(WALLPAPER);
  // Mockup room: 32 strips of 2,8 m, 3 per 10,05 m roll → 11 rolls; paste 44,78 / 30 → 2 packs.
  await expect(result(page)).toHaveText("11");
  // Exact: the tool text below (FAQ) also says «… 2 пачки клея».
  await expect(page.getByText("2 пачки", { exact: true })).toBeVisible();

  await page.getByText("1,06 × 10 м").click();
  await expect(result(page)).toHaveText("6");

  await page.getByText("0,53 × 10 м").click();
  await page.getByRole("button", { name: /Ещё параметры/ }).click();
  await page.getByRole("checkbox", { name: "Рисунок нужно совмещать" }).check();
  await type(page, "Раппорт", "64");
  // Each strip takes 3,2 m of the roll after the worst pattern start; the start puts two strips on the window
  // and pairs the closing strips, so the pieces fit the 11th roll (golden «Straight match, repeat 64 cm»).
  await expect(result(page)).toHaveText("11");
});

test("paint: a can set with sizes, ceiling switch, primer canister", async ({ page }) => {
  await page.goto(PAINT);
  // Walls 44,78 m² × 2 / 10 = 8,956 l → one 9 l can; primer 6,7 l → one 10 l canister.
  await expect(result(page)).toHaveText("1");
  await expect(page.getByText(/1\s×\s9\sл\s·\sостанется/)).toBeVisible();
  await expect(page.getByText(/^1\sканистра$/)).toBeVisible();
  await expect(page.getByText(/^по 10\sл$/)).toBeVisible();

  await page.getByRole("button", { name: "Что красим" }).click();
  await page.getByRole("radio", { name: "Стены и потолок" }).click();
  // + ceiling 19,78 → 12,912 l → 9 + 2,7 + 2 × 0,9
  await expect(result(page)).toHaveText("4");
  await expect(page.getByText(/1\s×\s9\sл \+ 1\s×\s2,7\sл \+ 2\s×\s0,9\sл/)).toBeVisible();
});

test("estimate: wallpaper on the walls and paint on the ceiling share one primer canister", async ({ page }) => {
  await page.goto(WALLPAPER);
  await expect(result(page)).toHaveText("11");
  await page.getByRole("button", { name: "Добавить в список" }).click();
  await expect(page.getByRole("button", { name: "В списке" })).toBeDisabled();
  // Wallpaper is one calc per room: no chips row to choose from.
  await expect(page.locator("[data-calc-chips]")).toHaveCount(0);

  await page.goto(PAINT);
  await page.getByRole("button", { name: "Что красим" }).click();
  await page.getByRole("radio", { name: "Потолок", exact: true }).click();
  await page.getByRole("button", { name: "Добавить в список" }).click();

  // Walls 44,78 × 0,15 + ceiling 19,78 × 0,15 = 9,68 л → one canister for both works.
  await page.goto("/spisok/");
  const primer = page.locator("[data-shared-row]", { hasText: "Грунтовка" });
  await expect(primer).toContainText(/1\sканистра/);
  const wallpaper = page.locator("[data-calc-row]", { hasText: "Обои" });
  await expect(wallpaper).toContainText(/11\sрулонов/);

  // The estimate follows the room: a longer room needs more wallpaper.
  await page.goto(WALLPAPER);
  await editRoom(page, { Длина: "6" });
  await page.goto("/spisok/");
  await expect(wallpaper).not.toContainText(/11\sрулонов/);
});

test("the old «Моя комната» and room list move into the estimate once", async ({ page }) => {
  await page.goto(LAMINATE);
  // What the builds before the estimate stored (zustand persist, version 1).
  await page.evaluate(() => {
    const old = (state: object) => JSON.stringify({ state, version: 1 });
    localStorage.setItem("umnyaut:room:v1", old({ room: { lengthMm: 3000, widthMm: 2500, heightMm: 2600 } }));
    localStorage.setItem("umnyaut:list:v1", old({ entries: [{ tool: "laminat", input: {} }] }));
  });
  await page.reload();
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^3\s×\s2,5\s×\s2,6\sм$/);
  await expect(page.getByRole("button", { name: "В списке" })).toBeDisabled();
  const stored = await page.evaluate(() => ({
    room: localStorage.getItem("umnyaut:room:v1"),
    list: localStorage.getItem("umnyaut:list:v1"),
    estimate: JSON.parse(localStorage.getItem("umnyaut:estimate:v1") ?? "null")?.state.estimate,
  }));
  expect(stored.room).toBeNull();
  expect(stored.list).toBeNull();
  expect(stored.estimate.rooms).toEqual([
    { id: "r1", name: "Комната 1", type: "other", lengthMm: 3000, widthMm: 2500, heightMm: 2600 },
  ]);
  expect(stored.estimate.calcs.map((c: { tool: string }) => c.tool)).toEqual(["laminat"]);
});

test("rooms: a new room starts from the example, the picker brings the first one back", async ({ page }) => {
  await page.goto(LAMINATE);
  await editRoom(page, { Длина: "5", Ширина: "4,3" });
  await page.reload();
  await expect(page.getByRole("button", { name: /^Комната 1, 5\s×\s4,3\sм/ })).toBeVisible();

  await page.getByRole("button", { name: /^Комната 1,/ }).click();
  await page.getByRole("button", { name: "Новая комната" }).click();
  const editor = page.getByRole("dialog", { name: "Новая комната" });
  await expect(editor.getByRole("textbox", { name: "Название" })).toHaveValue("Комната 2");
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await expect(page.getByRole("button", { name: /^Комната 2, Размеры не заданы/ })).toBeVisible();
  // 4,6 × 4,3 м of the example: 11 packs (92 boards row by row, laminate v3).
  await expect(result(page)).toHaveText("11");
  await editRoom(page, { Длина: "3", Ширина: "2,5" });
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^3\s×\s2,5\sм$/);

  await page.getByRole("button", { name: /^Комната 2,/ }).click();
  const first = page.getByRole("button", { name: /^Комната 1\s*5\s×\s4,3\sм/ });
  await expect(first).toBeVisible();
  await first.click();
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^5\s×\s4,3\sм$/);
});

test("room editor: name, type, an L-shape and a door on the plan reach the calculator; delete", async ({ page }) => {
  await page.goto(WALLS);
  await page.getByRole("button", { name: "Указать размеры" }).click();
  const editor = page.getByRole("dialog");
  for (const [label, value] of [
    ["Длина", "5"],
    ["Ширина", "4,3"],
  ] as const) {
    await editor.getByRole("textbox", { name: label, exact: true }).fill(value);
    await editor.getByRole("textbox", { name: label, exact: true }).blur();
  }
  // The type names a room the user has not named.
  await editor.getByRole("button", { name: "Ванная", exact: true }).click();
  await expect(editor.getByRole("textbox", { name: "Название" })).toHaveValue("Ванная");
  await expect(editor.getByRole("button", { name: "Ванная", exact: true })).toHaveAttribute("aria-pressed", "true");
  // 5 × 4,3 = 21,5 м², perimeter 18,6 м, walls 18,6 × 2,7 − 1,6 − 1,68 = 46,94 м².
  await expect(editor.getByText(/^21,5\sм²$/).first()).toBeVisible();
  await editor.getByRole("radio", { name: "Г-образная" }).click();
  // 21,5 − 1,5 × 1,2 = 19,7 м².
  await expect(editor.getByText(/^19,7\sм²$/).first()).toBeVisible();
  await editor.getByRole("button", { name: "Дверь", exact: true }).click();
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await expect(editor).toBeHidden();

  await expect(page.getByRole("button", { name: /^Ванная, 5\s×\s4,3\s×\s2,7\sм/ })).toBeVisible();
  // The editor started from the door and window the result was counted with, one more door added:
  // walls 2 × (5 + 4,3) × 2,7 = 50,22 − 1,6 − 1,68 − 1,6 = 45,34.
  await expect(result(page)).toHaveText("45,34");

  await page.getByRole("button", { name: "Изменить", exact: true }).click();
  await editor.getByRole("button", { name: "Удалить комнату" }).click();
  await expect(editor).toBeHidden();
  await expect(page.getByRole("button", { name: "Указать размеры" })).toBeVisible();
});

test("calcs in a room: chips, «+ Ещё» on the next surface, remove and «Вернуть»", async ({ page }) => {
  await page.goto(TILE);
  await editRoom(page, { Длина: "3", Ширина: "4,3" });
  // A material edit opens the room's first tile calc.
  await page.getByRole("radio", { name: "30 × 60" }).click();
  const chips = page.locator("[data-calc-chips]");
  await expect(chips.getByRole("button", { name: "Открыть расчёт «Пол»" })).toHaveAttribute("aria-pressed", "true");

  await chips.getByRole("button", { name: "Ещё расчёт: Плитка" }).click();
  await expect(chips.getByRole("button", { name: "Открыть расчёт «Стены»" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Что облицовываем" })).toHaveText(/Стены/);
  await expect(page.getByRole("radio", { name: "30 × 60" })).not.toBeChecked();

  await chips.getByRole("button", { name: "Открыть расчёт «Пол»" }).click();
  await expect(page.getByRole("button", { name: "Что облицовываем" })).toHaveText(/Пол/);
  await expect(page.getByRole("radio", { name: "30 × 60" })).toBeChecked();

  await chips.getByRole("button", { name: "Убрать расчёт «Стены»" }).click();
  await expect(chips.getByRole("button", { name: "Открыть расчёт «Стены»" })).toHaveCount(0);
  await page.getByRole("button", { name: "Вернуть", exact: true }).click();
  await expect(chips.getByRole("button", { name: "Открыть расчёт «Стены»" })).toBeVisible();
  // The chips scroll inside their row; the page never scrolls sideways.
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
    0,
  );

  // The next visit opens the calc opened last.
  await page.reload();
  await expect(chips.getByRole("button", { name: "Открыть расчёт «Пол»" })).toHaveAttribute("aria-pressed", "true");
});

test("calcs: «+ Ещё» while a surface is free; a calc on both overlaps — «Разделить»", async ({ page }) => {
  await page.goto(PAINT);
  await page.getByRole("button", { name: "Что красим" }).click();
  await page.getByRole("radio", { name: "Потолок", exact: true }).click();
  const chips = page.locator("[data-calc-chips]");
  await chips.getByRole("button", { name: "Ещё расчёт: Краска" }).click();
  await expect(chips.getByRole("button", { name: "Открыть расчёт «Стены»" })).toHaveAttribute("aria-pressed", "true");
  // Walls and ceiling are both counted: no more «+ Ещё».
  await expect(chips.getByRole("button", { name: "Ещё расчёт: Краска" })).toHaveCount(0);
  await page.getByRole("button", { name: "Что красим" }).click();
  await page.getByRole("radio", { name: "Стены и потолок" }).click();
  await expect(page.getByText("Потолок уже в расчёте «Краска: Потолок». Разделить на два расчёта?")).toBeVisible();
  await page.getByRole("button", { name: "Разделить", exact: true }).click();
  await expect(chips.getByRole("button", { name: /^Открыть расчёт/ })).toHaveText(["Потолок", "Стены", "Потолок"]);
});

test("estimate in the calculator: only the button adds, edits wait for «Обновить в списке»", async ({ page }) => {
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("umnyaut:estimate:v1") ?? "null")?.state.estimate);
  await page.goto(TILE);
  await editRoom(page, { Длина: "2,2", Ширина: "1,7" });
  await page.getByRole("button", { name: /Ещё параметры/ }).click();
  await type(page, "Цена коробки", "1650");
  // Changed fields and a price add nothing by themselves.
  await expect(page.getByRole("button", { name: "Добавить в список" })).toBeVisible();
  expect((await stored())?.calcs.every((c: { addedAt?: number }) => c.addedAt === undefined)).toBe(true);
  await page.getByRole("button", { name: "Добавить в список" }).click();
  await expect(page.getByRole("button", { name: "В списке" })).toBeDisabled();
  await expect(page.locator("#result").getByText("Нужно купить · Комната 1")).toBeVisible();

  // A change after that waits: the estimate keeps what was added until «Обновить в списке».
  await type(page, "Цена коробки", "2000");
  await expect(page.getByRole("button", { name: "Обновить в списке" })).toBeVisible();
  expect((await stored())?.calcs[0].input.price_tile).toBe(1650);
  await page.getByRole("button", { name: "Обновить в списке" }).click();
  await expect(page.getByRole("button", { name: "В списке" })).toBeDisabled();
  expect((await stored())?.calcs[0].input.price_tile).toBe(2000);
  // Back to the saved value: nothing to update.
  await type(page, "Цена коробки", "1650");
  await type(page, "Цена коробки", "2000");
  await expect(page.getByRole("button", { name: "В списке" })).toBeDisabled();

  // A second room with tile: the adhesive line shows this room's share and the estimate's bags.
  await page.reload();
  await page.getByRole("button", { name: /^Комната 1,/ }).click();
  await page.getByRole("button", { name: "Новая комната" }).click();
  const editor = page.getByRole("dialog", { name: "Новая комната" });
  await editor.getByRole("button", { name: "Кухня", exact: true }).click();
  for (const [label, value] of [
    ["Длина", "3"],
    ["Ширина", "2,8"],
  ] as const) {
    await editor.getByRole("textbox", { name: label, exact: true }).fill(value);
    await editor.getByRole("textbox", { name: label, exact: true }).blur();
  }
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await page.getByRole("radio", { name: "30 × 60" }).click();
  await page.getByRole("button", { name: "Добавить в список" }).click();
  await expect(page.getByRole("button", { name: "В списке" })).toBeDisabled();
  const result = page.locator("#result");
  await expect(result.getByText("Нужно купить · Кухня")).toBeVisible();
  await expect(result.getByText("Ещё понадобится · на весь список")).toBeVisible();
  await expect(result.getByText(/^Кухня: [\d,]+\sкг$/).first()).toBeVisible();

  // The header's total is saved in the estimate (Р3): the bathroom's tile is priced, the kitchen's is not.
  await expect.poll(async () => (await stored())?.totals?.byRoom?.r1).toBeGreaterThan(0);
  expect((await stored())?.totals?.byRoom?.r2).toBe(0);
});

test("plinth: planks and fittings, an L-shaped room adds corners", async ({ page }) => {
  await page.goto(PLINTH);
  // 17,8 − 0,8 = 17 м → 7 планок по 2,5 м.
  await expect(result(page)).toHaveText("7");
  await expect(page.getByText(/^4\sштуки$/)).toBeVisible();

  await editRoom(page, {}, (editor) => editor.getByRole("radio", { name: "Г-образная" }).click());
  await expect(page.locator("#result").getByText("Наружный угол")).toBeVisible();
});

test("tile adhesive and grout follow the tile size", async ({ page }) => {
  await page.goto(ADHESIVE);
  // 19,78 м² × (4,2 + 1,2 на плитку) = 106,8 кг → 5 мешков по 25 кг.
  await expect(result(page)).toHaveText("5");
  await page.getByRole("radio", { name: "10 × 10" }).click();
  // × 2,0 кг/м² = 39,6 кг → 2 мешка.
  await expect(result(page)).toHaveText("2");

  await page.goto(GROUT);
  // 0,256 кг/м² × 19,78 × 1,1 = 5,57 кг → 3 упаковки по 2 кг.
  await expect(result(page)).toHaveText("3");
});

test("linoleum: the best width and the cut length, a pinned width", async ({ page }) => {
  await page.goto(LINOLEUM);
  // 4,6 × 4,3: no roll covers it; 2,5 м across, 2 × (4,3 + 0,05) + 0,1 under the door = 8,8 м, 22 м² (v4).
  await expect(result(page)).toHaveText("8,8");
  await expect(page.getByText(/ширина 2,5\sм\s·\s22\sм²/)).toBeVisible();

  await page.getByRole("button", { name: "Ширина рулона" }).click();
  await page.getByRole("radio", { name: "4 м" }).click();
  await expect(page.getByText(/ширина 4\sм\s·\s35,2\sм²/)).toBeVisible();
});

test("laminate: the mockup room — 11 packs (85 boards by the scheme, 92 row by row), 9 across; diagonal adds 15 %", async ({
  page,
}) => {
  await page.goto(LAMINATE);
  await expect(result(page)).toHaveText("11");
  await expect(page.getByText("Если класть ряды в другую сторону, хватит 9 пачек")).toBeVisible();

  await page.getByRole("button", { name: "Укладка" }).click();
  await page.getByRole("radio", { name: "Диагональ" }).click();
  // 19,78 × 1,15 / 2,22 = 10,2 → 11
  await expect(result(page)).toHaveText("11");
  // The closed «Как посчитано» also holds this text (native <details> keeps it in the page).
  await expect(page.locator("li", { hasText: /по опыту укладчиков/ })).toBeVisible();
});

test("tile: piece count with reserve, centre start removes the narrow-cut hint", async ({ page }) => {
  await page.goto(TILE);
  // 210 whole + 30 cut = 240 × 1,1 = 264 → 22 коробки по 12.
  await expect(result(page)).toHaveText("22");
  await expect(page.getByText(/узкая подрезка/)).toBeVisible();
  await page.getByRole("button", { name: /Ещё параметры/ }).click();
  await page.getByRole("radio", { name: "От центра" }).click();
  await expect(page.getByText(/узкая подрезка/)).toBeHidden();
});

test("laminate scheme: rows from the count, a guide, the door moved on the plan moves the start", async ({ page }) => {
  await page.goto(LAMINATE);
  const scheme = page.locator("section[aria-labelledby=layout-scheme]");
  await expect(scheme.getByText("Рядов: 23 · целых: 59 · подрезанных: 40")).toBeVisible();
  await expect(scheme.getByText(/Начните от стены 1 в углу «Старт»/)).toBeVisible();
  await expect(scheme.getByText(/вдоль света из окна/)).toBeVisible();

  await scheme.getByText("Что резать по рядам").click();
  await expect(scheme.getByText("Ряд 23 · ширина 5,6 см")).toBeVisible();

  // Door from the bottom wall to the top one: laying now starts at the bottom wall, the count stays.
  await scheme.getByRole("button", { name: "Изменить план" }).click();
  const editor = page.getByRole("dialog");
  await editor.getByRole("button", { name: /^Дверь ·/ }).click();
  await editor.getByRole("button", { name: "Стена", exact: true }).first().click();
  await page.getByRole("radio", { name: "Стена 1" }).click();
  await editor.getByRole("button", { name: "Готово" }).click();
  await expect(scheme.getByText(/Начните от стены 3 в углу «Старт»/)).toBeVisible();
  await expect(result(page)).toHaveText("11");
});

test("room plan: a door placed in wall area shows on the plan and in room area", async ({ page }) => {
  await page.goto(WALLS);
  const plan = page.locator("section[aria-labelledby=layout-scheme]");
  await expect(plan.getByRole("heading", { name: "План комнаты" })).toBeVisible();
  await expect(plan.getByText("Стен: 4 · двери и окна не отмечены")).toBeVisible();
  await expect(plan.getByText(/ещё 2 шт\./)).toBeVisible();

  await plan.getByRole("button", { name: "Отметить на плане" }).click();
  const editor = page.getByRole("dialog");
  await editor.getByRole("button", { name: /^Дверь ·/ }).click();
  await editor.getByRole("button", { name: "Стена", exact: true }).first().click();
  await page.getByRole("radio", { name: "Стена 3" }).click();
  await editor.getByRole("button", { name: "Готово" }).click();
  await expect(plan.getByText("Стен: 4 · дверей: 1 · окон: 0")).toBeVisible();
  await expect(plan.getByText(/ещё 1 шт\./)).toBeVisible();
  await expect(result(page)).toHaveText("44,78");

  // The door is part of “My room” now: room area draws it too.
  await page.goto(ROOM);
  await expect(
    page.locator("section[aria-labelledby=layout-scheme]").getByText("Стен: 4 · дверей: 1 · окон: 0"),
  ).toBeVisible();
});

test("tile walls scheme: four walls unfolded, the window's sill on the plan changes the count", async ({ page }) => {
  await page.goto(`${TILE}?s=${s({ surface: "walls" })}`);
  const scheme = page.locator("section[aria-labelledby=layout-scheme]");
  // Door and window placed: 534 tiles × 1,1 = 588 → 49 коробок (golden «Walls of the example room»).
  await expect(scheme.getByText("Плиток на стенах: 534 · целых: 406 · подрезанных: 128")).toBeVisible();
  await expect(result(page)).toHaveText("49");
  await expect(scheme.getByRole("img", { name: /^Стена 3, длина 4,6 м/ })).toBeVisible();
  await scheme.getByText("Что резать по стенам").click();
  await expect(scheme.getByText(/у дверей и окон: 18/)).toBeVisible();

  // The window from 90 to 100 cm above the floor: 537 tiles → 591 → 50 коробок.
  await scheme.getByRole("button", { name: "Изменить план" }).click();
  const editor = page.getByRole("dialog");
  await editor.getByRole("button", { name: /^Окно ·/ }).click();
  await type(page, "Высота от пола", "100");
  await editor.getByRole("button", { name: "Готово" }).click();
  await expect(result(page)).toHaveText("50");
});

test("wallpaper scheme: a chosen start line, a cutting map, whole strips or cut at the opening edges, a bare zone", async ({
  page,
}) => {
  await page.goto(WALLPAPER);
  const scheme = page.locator("section[aria-labelledby=layout-scheme]");
  // Golden «Mockup room … (defaults)»: 33 strips (2 narrow closing ones), 3 pieces, 11 rolls.
  await expect(scheme.getByText("Полос: 33 · кусков: 3 · рулонов: 11")).toBeVisible();
  await expect(result(page)).toHaveText("11");
  await expect(scheme.getByText(/Начните со стены 1: отбейте уровнем вертикальную линию в 20 см/)).toBeVisible();
  await expect(scheme.getByText(/Последний стык — в углу между стенами 2 и 3, у двери/)).toBeVisible();
  await scheme.getByText("Карта раскроя", { exact: true }).click();
  await expect(scheme.getByText(/кусок К1 под окном — 1 м \(из остатка\)/)).toBeVisible();

  // Golden «Owner's sizes with the example door and window … scenario A»: 4,6 × 4,3 × 2,8, roll 1,06 × 10 m.
  await page.goto(`${WALLPAPER}?s=${s({ heightMm: 2800, rollWidthMm: 1060, rollLengthMm: 10_000 })}`);
  await expect(result(page)).toHaveText("6");
  await expect(page.getByText("Рулонов по карте раскроя")).toBeVisible();
  await expect(page.getByText(/Если резать полосы по краю окон и дверей, нужно 5\s?рулонов вместо 6/)).toBeVisible();
  // Golden «… cut at the edges»: the same room the other way round the openings — 5 rolls and the joints warning.
  await page.goto(
    `${WALLPAPER}?s=${s({ heightMm: 2800, rollWidthMm: 1060, rollLengthMm: 10_000, aroundOpenings: "edge" })}`,
  );
  await expect(result(page)).toHaveText("5");
  await expect(
    page.getByText(/Стыков по краю окон и дверей: 4\. Над углами проёмов чаще всего идут трещины/),
  ).toBeVisible();

  await page.goto(`${WALLPAPER}?s=${s({ openings: [{ type: "door", widthMm: 800, heightMm: 2000, count: 1 }] })}`);
  await expect(scheme.getByText("Отметьте двери и окна на плане — тогда разложим полосы по стенам")).toBeVisible();
});

test("pack price gives a total and «без N позиций» for items without one", async ({ page }) => {
  await page.goto(LAMINATE);
  await page.getByRole("button", { name: /Ещё параметры/ }).click();
  await type(page, "Цена пачки", "1800");
  // 11 пачек × 1800; подложка без цены.
  const total = page.locator("#result [data-result-total]");
  await expect(total).toContainText("Итого");
  await expect(total).toContainText(/19\s800/);
  await expect(total).toContainText(/без 1 позиции/);
});

test("tile on «Пол и стены»: one calc for both, one box count, the estimate says so", async ({ page }) => {
  await page.goto(TILE);
  await page.getByRole("button", { name: "Что облицовываем" }).click();
  await page.getByRole("radio", { name: "Пол и стены" }).click();
  // Floor 240 + walls 534 pieces × 1,1 = 852 tiles → 71 boxes of 12.
  await expect(result(page)).toHaveText("71");
  await page.getByRole("button", { name: "Добавить в список" }).click();
  // Both surfaces are taken: nothing left for «+ Ещё».
  await expect(page.getByRole("button", { name: /^Ещё расчёт/ })).toHaveCount(0);
  await page.goto("/spisok/");
  await expect(page.locator("[data-calc-row]", { hasText: "Плитка" })).toContainText("пол и стены");
});

test("«Сообщить об ошибке» sends the message with the tool, its formula version and the input (P7.7)", async ({
  page,
}) => {
  // Previews run without a database: the API is answered here.
  const sent: Array<Record<string, unknown>> = [];
  let status = 429;
  await page.route("**/api/reports/", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill(
      status === 429
        ? { status, json: { ok: false, error: { code: "rate_limited", message: "" } } }
        : { status, json: { ok: true, data: { id: 1 } } },
    );
  });
  await page.goto(WALLPAPER);
  await page.locator("summary", { hasText: "Как посчитано" }).click();
  await page.getByRole("button", { name: "Сообщить об ошибке" }).click();
  const dialog = page.getByRole("dialog", { name: "Сообщить об ошибке" });
  await expect(dialog.getByRole("button", { name: "Отправить" })).toBeDisabled();
  await dialog.getByLabel("Что не так").fill("В магазине сказали, что нужно больше");

  await dialog.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText(/Сообщений за час уже много/)).toBeVisible();
  await expect(dialog).toBeVisible();

  status = 201;
  await dialog.getByRole("button", { name: "Отправить" }).click();
  await expect(page.getByText(/Спасибо! Сообщение у нас/)).toBeVisible();
  await expect(dialog).toBeHidden();
  expect(sent[1]).toMatchObject({
    tool: "oboi",
    message: "В магазине сказали, что нужно больше",
    pageUrl: "/steny/oboi/",
  });
  expect(sent[1]?.toolVersion).toEqual(expect.any(Number));
  expect(sent[1]?.input).toEqual(expect.any(Object));
  expect(sent[1]).not.toHaveProperty("website");
});
