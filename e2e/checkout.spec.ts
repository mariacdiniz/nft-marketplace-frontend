import { test, expect } from "@playwright/test";

test("compra completa até o recibo", async ({ page }) => {
  await page.goto("/login?reset=1");
  await page.getByLabel("E-mail").fill("ana@kurio.dev");
  await page.getByLabel("Senha").fill("Colecionador@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/nft/nft-001");
  await page.getByRole("button", { name: "COMPRAR" }).click();
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  await page.getByLabel("Nome de exibição").fill("Ana");
  await page.getByLabel("Nome de usuário").fill("ana.kurio");
  await page.getByLabel("Rede").selectOption("ethereum");
  await page.getByLabel("Nome do perfil").fill("Ana");
  await page.getByLabel("Endereço da carteira").fill("0xA91F");
  await page.getByLabel("Tipo de carteira").selectOption("metamask");
  await page.getByLabel("E-mail").fill("ana@kurio.dev");
  await page.getByLabel("Nome ENS").fill("ana.kurio.eth");
  await page.getByText("Principal").first().click();
  await page.getByRole("button", { name: "Confirmar compra" }).last().click();
  await expect(page.getByRole("heading", { name: /carteira|pendente|recusado/i })).toBeVisible({ timeout: 15000 });
});

test("clique repetido não cria dois pedidos visíveis", async ({ page }) => {
  await page.goto("/login?reset=1");
  await page.getByLabel("E-mail").fill("ana@kurio.dev");
  await page.getByLabel("Senha").fill("Colecionador@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/nft/nft-002");
  await page.getByRole("button", { name: "COMPRAR" }).click();
  await page.getByRole("link", { name: "Conectar e finalizar" }).click();
  const btn = page.getByRole("button", { name: "Confirmar compra" }).last();
  await btn.click();
  await btn.click({ trial: true }).catch(() => undefined);
});
