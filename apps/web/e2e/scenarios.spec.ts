import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Scenarios 1–7 of the «Комнаты и смета» spec (P17.15), one journey each, on the phone and the desktop projects.
 * The details of each step have their own tests in calculator.spec.ts and estimate.spec.ts; these follow a person
 * through the whole scenario. They follow the decisions made after the spec's text: a calc joins the list only by
 * its button (Р4), the header shows the number of calcs (P17.14), the «Метка» field is gone (2026-10-15).
 */

const KEY = "umnyaut:estimate:v1";
const LAMINATE = "/pol/laminat/";
const TILE = "/plitka/plitka/";
const WALLPAPER = "/steny/oboi/";

const result = (page: Page) => page.locator("[data-result-value]").first();
const stored = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null")?.state.estimate, KEY);
const headerCount = (page: Page) => page.locator("[data-estimate-button] [data-header-count]");

async function fillSizes(editor: Locator, sizes: Record<string, string>) {
  for (const [label, value] of Object.entries(sizes)) {
    const field = editor.getByRole("textbox", { name: label, exact: true });
    await field.fill(value);
    await field.blur();
  }
}

/** Seeds the estimate before the first page of the test loads, once (a reload keeps what the test changed). */
async function seed(page: Page, estimate: object) {
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(key as string, value as string);
        sessionStorage.setItem("seeded", "1");
      }
    },
    [KEY, JSON.stringify({ state: { estimate }, version: 1 })],
  );
}

async function add(page: Page) {
  await page.getByRole("button", { name: "Добавить в список" }).click();
  await expect(page.getByRole("button", { name: "В списке" })).toBeDisabled();
}

test("1 · first visit from search: the result at once, sizes make «Комната 1», the button adds it", async ({
  page,
}) => {
  await page.goto(LAMINATE);
  // Nothing asked: the example room is counted and no editor opens.
  await expect(result(page)).toHaveText("10");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(headerCount(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Указать размеры" }).click();
  const editor = page.getByRole("dialog");
  await fillSizes(editor, { Длина: "5", Ширина: "4,3" });
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await expect(editor).toBeHidden();
  await expect(page.getByRole("button", { name: /^Комната 1, 5\s×\s4,3\sм/ })).toBeVisible();

  // Sizes alone add nothing (Р4): the list is filled by the button.
  expect((await stored(page))?.calcs.every((c: { addedAt?: number }) => c.addedAt === undefined)).toBe(true);
  await add(page);
  await expect(headerCount(page)).toHaveText("1");
  const estimate = await stored(page);
  expect(estimate.rooms.map((r: { name: string }) => r.name)).toEqual(["Комната 1"]);
  expect(estimate.calcs.filter((c: { addedAt?: number }) => c.addedAt).map((c: { tool: string }) => c.tool)).toEqual([
    "laminat",
  ]);
});

test("2 · a second room: «Новая комната» in the room row, the editor, the calculator counts for it", async ({
  page,
}) => {
  await page.goto(TILE);
  await page.getByRole("button", { name: "Указать размеры" }).click();
  await fillSizes(page.getByRole("dialog"), { Длина: "4", Ширина: "3" });
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить комнату" }).click();
  await add(page);
  const first = await result(page).textContent();

  await page.getByRole("button", { name: /^Комната 1,/ }).click();
  await page.getByRole("button", { name: "Новая комната" }).click();
  const editor = page.getByRole("dialog", { name: "Новая комната" });
  await editor.getByRole("button", { name: "Ванная", exact: true }).click();
  await fillSizes(editor, { Длина: "2,2", Ширина: "1,7" });
  await editor.getByRole("button", { name: "Дверь", exact: true }).click();
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await expect(editor).toBeHidden();

  await expect(page.getByRole("button", { name: /^Ванная, 2,2\s×\s1,7/ })).toBeVisible();
  await expect(result(page)).not.toHaveText(first ?? "");
  const estimate = await stored(page);
  expect(estimate.rooms.map((r: { name: string }) => r.name)).toEqual(["Комната 1", "Ванная"]);
  expect(estimate.activeRoomId).toBe(estimate.rooms[1].id);
  expect(estimate.rooms[1].openings).toHaveLength(1);
});

test("3 · the same room, another material: «Дальше по ремонту» opens the plinth with the room", async ({ page }) => {
  await page.goto(LAMINATE);
  await page.getByRole("button", { name: "Указать размеры" }).click();
  await fillSizes(page.getByRole("dialog"), { Длина: "5", Ширина: "4,3" });
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить комнату" }).click();
  await add(page);

  await page
    .getByRole("region", { name: "Дальше по ремонту" })
    .getByRole("link", { name: /Плинтус/ })
    .click();
  await expect(page).toHaveURL(/\/pol\/plintus\/$/);
  // The room is chosen, its sizes and doors are in: only the plank is left to choose.
  await expect(page.getByRole("button", { name: /^Комната 1, 5\s×\s4,3/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Указать размеры" })).toHaveCount(0);
  await expect(result(page)).toHaveText(/^\d+$/);
  await add(page);
  await expect(headerCount(page)).toHaveText("2");
});

test("4 · the list: the header opens every room and the shared consumables, a row leads back", async ({ page }) => {
  await seed(page, {
    schemaVersion: 2,
    id: "s4",
    name: "Ремонт квартиры",
    country: "RU",
    rooms: [
      { id: "r1", name: "Зал", type: "living", lengthMm: 4600, widthMm: 4300, heightMm: 2700, openings: [] },
      { id: "r2", name: "Ванная", type: "bathroom", lengthMm: 2200, widthMm: 1700, heightMm: 2500, openings: [] },
      { id: "r3", name: "Кухня", type: "kitchen", lengthMm: 3000, widthMm: 2800, heightMm: 2700, openings: [] },
    ],
    calcs: [
      {
        id: "c1",
        roomId: "r1",
        tool: "laminat",
        toolVersion: 2,
        surface: "floor",
        input: { price_laminate: 1120 },
        openedAt: 1,
        addedAt: 1,
      },
      { id: "c2", roomId: "r2", tool: "plitka", toolVersion: 5, surface: "walls", input: {}, openedAt: 2, addedAt: 2 },
      { id: "c3", roomId: "r3", tool: "plitka", toolVersion: 5, surface: "floor", input: {}, openedAt: 3, addedAt: 3 },
    ],
    prices: {},
    activeRoomId: "r1",
    updatedAt: 3,
  });
  await page.goto("/");
  await page.locator("[data-estimate-button]").click();
  await expect(page).toHaveURL(/\/spisok\/$/);

  for (const room of ["Зал", "Ванная", "Кухня"]) await expect(page.locator(`[data-room-card="${room}"]`)).toBeVisible();
  // Tile in two rooms: the adhesive is bought once for both.
  const shared = page.locator("[data-shared-card]");
  await expect(shared).toContainText("Плиточный клей");
  await expect(shared).toContainText(/на \d+ упаковк\S* меньше, чем по комнатам/);
  const total = page.getByRole("complementary", { name: "Итого по списку" });
  await expect(total).toContainText(/11\s200\s₽/);
  for (const name of ["Печать / PDF", "Отправить", "Скопировать", "Ссылка"])
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();

  await page.locator('[data-room-card="Кухня"] [data-calc-row] a').first().click();
  await expect(page).toHaveURL(/\/plitka\/plitka\/$/);
  await expect(page.getByRole("button", { name: /^Кухня,/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Что облицовываем" })).toHaveText(/Пол/);
  expect((await stored(page))?.activeRoomId).toBe("r3");
});

test("5 · new sizes: the editor names what it recounts and resets, every calc and the list follow", async ({
  page,
}) => {
  await seed(page, {
    schemaVersion: 2,
    id: "s5",
    name: "Ремонт квартиры",
    country: "RU",
    rooms: [
      { id: "r1", name: "Спальня", type: "bedroom", lengthMm: 4000, widthMm: 3000, heightMm: 2700, openings: [] },
    ],
    calcs: [
      { id: "c1", roomId: "r1", tool: "laminat", toolVersion: 2, surface: "floor", input: {}, openedAt: 1, addedAt: 1 },
      {
        id: "c2",
        roomId: "r1",
        tool: "oboi",
        toolVersion: 6,
        surface: "walls",
        input: { startMode: "manual", startWall: 2 },
        openedAt: 2,
        addedAt: 2,
      },
    ],
    prices: {},
    activeRoomId: "r1",
    updatedAt: 2,
  });
  await page.goto("/spisok/");
  const laminate = page.locator("[data-calc-row]", { hasText: "Ламинат" });
  const wallpaper = page.locator("[data-calc-row]", { hasText: "Обои" });
  const before = { laminate: await laminate.textContent(), wallpaper: await wallpaper.textContent() };

  await page.goto(WALLPAPER);
  await page.getByRole("button", { name: "Изменить", exact: true }).click();
  const editor = page.getByRole("dialog");
  await fillSizes(editor, { Длина: "6" });
  const recalc = editor.locator("[data-room-recalc]");
  await expect(recalc).toContainText("Пересчитаем расчёты этой комнаты: Обои, Ламинат");
  // Longer walls keep their numbers: nothing is reset yet.
  await expect(recalc).not.toContainText("сбросим");
  // An L-shape numbers the walls anew: the chosen start goes back to the default (Р10).
  await editor.getByRole("radio", { name: "Г-образная" }).click();
  await expect(recalc).toContainText("Обои: сбросим начало оклейки, главную стену и зоны без обоев");
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();
  await expect(editor).toBeHidden();

  const estimate = await stored(page);
  expect(estimate.rooms[0]).toMatchObject({ lengthMm: 6000, shape: "l" });
  expect(estimate.calcs.find((c: { id: string }) => c.id === "c2").input.startWall).toBeUndefined();

  await page.goto("/spisok/");
  await expect(laminate).not.toHaveText(before.laminate ?? "");
  await expect(wallpaper).not.toHaveText(before.wallpaper ?? "");
});

test("6 · tile on the walls and on the floor differ: «+ Ещё» makes a second calc, the first is untouched", async ({
  page,
}) => {
  await page.goto(TILE);
  await page.getByRole("button", { name: "Указать размеры" }).click();
  const editor = page.getByRole("dialog");
  await editor.getByRole("button", { name: "Ванная", exact: true }).click();
  await fillSizes(editor, { Длина: "2,2", Ширина: "1,7" });
  await editor.getByRole("button", { name: "Сохранить комнату" }).click();

  await page.getByRole("button", { name: "Что облицовываем" }).click();
  await page.getByRole("radio", { name: "Стены", exact: true }).click();
  await page.getByRole("radio", { name: "30 × 60" }).click();
  await add(page);
  const walls = await result(page).textContent();

  const chips = page.locator("[data-calc-chips]");
  await chips.getByRole("button", { name: "Ещё расчёт: Плитка" }).click();
  await expect(chips.getByRole("button", { name: "Открыть расчёт «Пол»" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("radio", { name: "60 × 60" }).click();
  await add(page);

  await chips.getByRole("button", { name: "Открыть расчёт «Стены»" }).click();
  await expect(page.getByRole("radio", { name: "30 × 60" })).toBeChecked();
  await expect(result(page)).toHaveText(walls ?? "");

  await page.goto("/spisok/");
  const rows = page.locator('[data-room-card="Ванная"] [data-calc-row]', { hasText: "Плитка" });
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: "стены" })).toHaveCount(1);
  await expect(rows.filter({ hasText: "пол" })).toHaveCount(1);
});

test("7 · from the old version: «Моя комната» becomes «Комната 1», saved calcs are its calcs, nothing lost", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    // What the builds before the estimate stored (zustand persist, version 1).
    const old = (state: object) => JSON.stringify({ state, version: 1 });
    localStorage.setItem("umnyaut:room:v1", old({ room: { lengthMm: 3000, widthMm: 2500, heightMm: 2600 } }));
    localStorage.setItem(
      "umnyaut:list:v1",
      old({
        entries: [
          { tool: "laminat", input: {} },
          { tool: "plintus", input: {} },
        ],
      }),
    );
    sessionStorage.setItem("seeded", "1");
  });
  await page.goto("/spisok/");
  const room = page.locator('[data-room-card="Комната 1"]');
  await expect(room.locator("[data-calc-row]")).toHaveCount(2);
  await expect(room).toContainText("Ламинат");
  await expect(room).toContainText("Плинтус");
  await expect(headerCount(page)).toHaveText("2");
  const old = await page.evaluate(() => [
    localStorage.getItem("umnyaut:room:v1"),
    localStorage.getItem("umnyaut:list:v1"),
  ]);
  expect(old).toEqual([null, null]);

  // The room's sizes reach every calculator.
  await room.locator("[data-calc-row] a").first().click();
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^3\s×\s2,5/);
});
