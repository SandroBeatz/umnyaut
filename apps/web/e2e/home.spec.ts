import { expect, type Page, test } from "@playwright/test";

async function type(page: Page, label: string, value: string) {
  const field = page.getByRole("textbox", { name: label, exact: true });
  await field.fill(value);
  await field.blur();
}

const card = (page: Page, title: string) => page.getByRole("link", { name: new RegExp(`^${title}:`) });

test("home: “My room” recomputes the example and carries over to a tool", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Одна комната — весь список покупок");
  await expect(page.getByRole("heading", { name: "Для комнаты 12 м² нужно" })).toBeVisible();
  await expect(card(page, "Ламинат")).toContainText("6 пачек");

  await type(page, "Длина", "6");
  await expect(page.getByRole("heading", { name: "Для комнаты 18 м² нужно" })).toBeVisible();
  await expect(card(page, "Ламинат")).not.toContainText("6 пачек");

  // Works pick the cards: tile on, floor off.
  await page.getByRole("button", { name: "Плитка", exact: true }).click();
  await page.getByRole("button", { name: "Пол", exact: true }).click();
  await expect(card(page, "Плитка")).toBeVisible();
  await expect(card(page, "Ламинат")).toHaveCount(0);

  await page.getByRole("button", { name: "Выбрать расчёт" }).click();
  await expect(page.getByRole("heading", { name: "Выберите, что нужно рассчитать" })).toBeFocused();

  await page.getByRole("link", { name: /^Пол/ }).first().click();
  await expect(page).toHaveURL("/pol/");
  await expect(page.locator("[data-room-dimensions]")).toHaveText(/^6\s×\s3\s×\s2,7\sм$/);

  // Category: work order leads into the tools, the room comes along.
  await expect(page.getByRole("heading", { name: "Порядок работ" })).toBeVisible();
  await page.getByRole("link", { name: "Плинтус", exact: true }).click();
  await expect(page).toHaveURL("/pol/plintus/");
  await expect(page.getByRole("textbox", { name: "Длина комнаты" })).toHaveValue("6");
});
