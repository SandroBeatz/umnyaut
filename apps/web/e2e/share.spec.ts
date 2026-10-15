import { expect, test } from "@playwright/test";

test("«Скопировать» and print carry the result without a link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/steny/oboi/");
  await page.getByRole("button", { name: "Скопировать" }).click();
  await expect(page.getByText("Расчёт скопирован")).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toMatch(/рулон/);
  expect(text).not.toMatch(/https?:\/\//);
  expect(text).not.toContain("Открыть расчёт");

  await page.emulateMedia({ media: "print" });
  const sheet = page.locator(".print\\:block").first();
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("Дата расчёта");
  await expect(sheet).not.toContainText("http");
});
