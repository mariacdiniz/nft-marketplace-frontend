import { test, expect } from "@playwright/test";

test("carrinho quantidade, cupom e persistência", async ({ page }) => {
  await page.goto("/nft/nft-001?reset=1");
  await page.getByRole("button", { name: "COMPRAR" }).click();
  await expect(page).toHaveURL(/cart/);
  await page.getByLabel("Aumentar").first().click();
  await page.getByPlaceholder("Digite o código promocional").fill("LANCAMENTO");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByText(/Desconto/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Emerald Ape/)).toBeVisible();
});
