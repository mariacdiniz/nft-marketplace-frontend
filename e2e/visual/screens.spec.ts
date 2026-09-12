import { test, expect } from "@playwright/test";

test.describe("regressão visual", () => {
  test("início", async ({ page }) => {
    await page.goto("/?reset=1");
    await expect(page).toHaveScreenshot("inicio.png", { fullPage: true, maxDiffPixelRatio: 0.12 });
  });
  test("detalhe", async ({ page }) => {
    await page.goto("/nft/nft-001?reset=1");
    await expect(page).toHaveScreenshot("detalhe.png", { fullPage: true, maxDiffPixelRatio: 0.12 });
  });
  test("carrinho", async ({ page }) => {
    await page.goto("/nft/nft-001?reset=1");
    await page.getByRole("button", { name: "COMPRAR" }).click();
    await expect(page).toHaveScreenshot("carrinho.png", { fullPage: true, maxDiffPixelRatio: 0.12 });
  });
  test("pagamento", async ({ page }) => {
    await page.goto("/login?reset=1");
    await page.getByLabel("E-mail").fill("ana@kurio.dev");
    await page.getByLabel("Senha").fill("Colecionador@123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.goto("/nft/nft-001");
    await page.getByRole("button", { name: "COMPRAR" }).click();
    await page.getByRole("link", { name: "Conectar e finalizar" }).click();
    await expect(page).toHaveScreenshot("pagamento.png", { fullPage: true, maxDiffPixelRatio: 0.12 });
  });
});
