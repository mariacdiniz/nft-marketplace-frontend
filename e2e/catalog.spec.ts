import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?reset=1&scenario=default");
});

test("busca, filtros, paginação e histórico", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /SEJA DONO DO FUTURO/i })).toBeVisible();
  await page.getByRole("button", { name: /Arte digital/ }).click();
  await expect(page).toHaveURL(/category=/);
  await page.getByRole("button", { name: "2" }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.goBack();
  await expect(page).toHaveURL(/category=/);
});

test("detalhe existente e 404", async ({ page }) => {
  await page.goto("/nft/nft-001?reset=1");
  await expect(page.getByRole("heading", { name: /Emerald Ape/ })).toBeVisible();
  await page.goto("/nft/nao-existe?reset=1");
  await expect(page.getByRole("heading", { name: /não encontrado/i })).toBeVisible();
});
