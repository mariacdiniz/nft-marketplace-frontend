import { test, expect } from "@playwright/test";

test("navegação por teclado e labels", async ({ page }) => {
  await page.goto("/login?reset=1");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("skeleton em latência", async ({ page }) => {
  await page.goto("/?reset=1&scenario=latency");
  await expect(page.locator(".animate-shimmer").first()).toBeVisible();
});
