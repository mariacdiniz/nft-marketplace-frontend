import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login?reset=1");
});

test("login, logout e troca de usuário isolam dados", async ({ page }) => {
  await page.getByLabel("E-mail").fill("ana@kurio.dev");
  await page.getByLabel("Senha").fill("Colecionador@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/account/profile");
  await expect(page.getByLabel("E-mail")).toHaveValue("ana@kurio.dev");
  await page.getByRole("button", { name: "Sair" }).click();
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("bruno@kurio.dev");
  await page.getByLabel("Senha").fill("Colecionador@123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/account/profile");
  await expect(page.getByLabel("E-mail")).toHaveValue("bruno@kurio.dev");
});

test("cadastro com e-mail duplicado", async ({ page }) => {
  await page.goto("/register?reset=1&scenario=register-conflict");
  await page.getByLabel("Nome de usuário").fill("nova");
  await page.getByLabel("Digite seu e-mail").fill("ana@kurio.dev");
  await page.getByLabel("Senha", { exact: true }).fill("Colecionador@123");
  await page.getByLabel("Confirmar senha").fill("Colecionador@123");
  await page.getByRole("button", { name: "Criar perfil" }).click();
  await expect(page.getByRole("alert")).toContainText(/já cadastrado|inválid/i);
});
