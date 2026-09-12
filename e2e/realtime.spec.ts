import { test, expect } from "@playwright/test";

test("evento nft.updated atualiza o carrinho", async ({ page }) => {
  await page.goto("/nft/nft-001?reset=1");
  await page.getByRole("button", { name: "COMPRAR" }).click();
  await expect(page.getByText("1.19 ETH").first()).toBeVisible();
  await page.evaluate(async () => {
    const { io } = await import("socket.io-client");
    const s = io(window.location.origin, { transports: ["websocket"] });
    s.emit("debug:nft.updated", { nftId: "nft-001", priceEth: "3.33" });
  });
  await expect(page.getByText(/mudou|3.33/i)).toBeVisible({ timeout: 10000 });
});
