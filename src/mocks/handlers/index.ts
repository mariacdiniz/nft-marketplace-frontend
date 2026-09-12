import { delay, http, HttpResponse } from "msw";
import Decimal from "decimal.js";
import {
  addItem,
  buildCatalogMeta,
  checkPassword,
  getCart,
  loadState,
  memory,
  mergeGuest,
  ownerKey,
  publicUser,
  quoteCart,
  resetState,
  saveState,
} from "../engine";
import type { MockUser } from "../engine";
import type { Order } from "@/types";

async function maybeDelay() {
  loadState();
  if (memory.latencyMs) await delay(memory.latencyMs);
  if (memory.scenario === "offline") return HttpResponse.error();
  if (memory.scenario === "http-500") {
    return HttpResponse.json(
      { error: { code: "internal", message: "Falha transitória do servidor" } },
      { status: 500 },
    );
  }
  return null;
}

function json(data: unknown, status = 200) {
  saveState();
  return HttpResponse.json(data, { status });
}

function err(status: number, message: string, code: string, fields?: Record<string, string>) {
  return HttpResponse.json({ error: { code, message, fields } }, { status });
}

const api = "*/api";

export const sessionHandlers = [
  http.get(`${api}/session`, async () => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    if (memory.scenario === "session-expired") {
      memory.sessionUserId = null;
      return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    }
    const user = memory.users.find((u) => u.id === memory.sessionUserId);
    return json({ user: user ? publicUser(user) : null, scenario: memory.scenario });
  }),
];

export const authHandlers = [
  http.post(`${api}/auth/register`, async ({ request }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    const body = (await request.json()) as { username: string; email: string; password: string; confirmPassword?: string };
    if (!body.username || !body.email || !body.password) {
      return err(422, "Dados inválidos", "validation", { email: "Preencha todos os campos" });
    }
    if (body.confirmPassword && body.confirmPassword !== body.password) {
      return err(422, "As senhas não coincidem", "validation", { confirmPassword: "As senhas não coincidem" });
    }
    if (memory.users.some((u) => u.email === body.email) || memory.scenario === "register-conflict") {
      return err(409, "E-mail já cadastrado", "email_conflict");
    }
    const user: MockUser = {
      id: `user-${Date.now()}`,
      email: body.email,
      username: body.username,
      displayName: body.username,
      ensName: `${body.username}.eth`,
      walletNickname: "Principal",
      avatarUrl: null,
      password: `hashed:${body.password}`,
    };
    memory.users.push(user);
    memory.favorites[user.id] = [];
    memory.carts.push({ id: `cart-${user.id}`, ownerKey: `user:${user.id}`, items: [], couponCode: null });
    mergeGuest(user.id);
    memory.sessionUserId = user.id;
    return json({ user: publicUser(user) }, 201);
  }),
  http.post(`${api}/auth/login`, async ({ request }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    const body = (await request.json()) as { email: string; password: string };
    const user = memory.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (!user || !checkPassword(user, body.password)) {
      return err(401, "Credenciais inválidas", "invalid_credentials");
    }
    mergeGuest(user.id);
    memory.sessionUserId = user.id;
    return json({ user: publicUser(user) });
  }),
  http.post(`${api}/auth/logout`, async () => {
    memory.sessionUserId = null;
    saveState();
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${api}/auth/social`, async ({ request }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    const body = (await request.json()) as { provider?: string };
    if (body.provider !== "google" && body.provider !== "facebook") {
      return err(422, "Provedor inválido", "validation");
    }
    const email = body.provider === "google" ? "google.user@kurio.dev" : "facebook.user@kurio.dev";
    let user = memory.users.find((u) => u.email === email);
    if (!user) {
      user = {
        id: `user-${body.provider}`,
        email,
        username: body.provider === "google" ? "google.kurio" : "facebook.kurio",
        displayName: body.provider === "google" ? "Colecionador Google" : "Colecionador Facebook",
        ensName: `${body.provider}.kurio.eth`,
        walletNickname: "Principal",
        avatarUrl: null,
        password: "hashed:social",
      };
      memory.users.push(user);
      memory.favorites[user.id] = [];
      memory.carts.push({ id: `cart-${user.id}`, ownerKey: `user:${user.id}`, items: [], couponCode: null });
    }
    mergeGuest(user.id);
    memory.sessionUserId = user.id;
    return json({ user: publicUser(user) });
  }),
];

export const nftHandlers = [
  http.get(`${api}/nfts`, async ({ request }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    const url = new URL(request.url);
    let items = [...memory.nfts];
    const q = url.searchParams.get("q")?.toLowerCase();
    const category = url.searchParams.get("category");
    const network = url.searchParams.get("network");
    const tab = url.searchParams.get("tab");
    const sort = url.searchParams.get("sort");
    const min = url.searchParams.get("minPrice");
    const max = url.searchParams.get("maxPrice");
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 9) || 9;
    if (q) {
      items = items.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.collection.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q),
      );
    }
    if (category) items = items.filter((n) => n.category === category);
    if (network) items = items.filter((n) => n.network === network);
    if (tab === "novos") items = items.filter((n) => n.status === "novo");
    if (tab === "alta") items = items.filter((n) => n.status === "em_alta");
    if (min) items = items.filter((n) => new Decimal(n.priceEth).gte(min));
    if (max) items = items.filter((n) => new Decimal(n.priceEth).lte(max));
    if (sort === "preco_asc") items.sort((a, b) => new Decimal(a.priceEth).cmp(b.priceEth));
    else if (sort === "preco_desc") items.sort((a, b) => new Decimal(b.priceEth).cmp(a.priceEth));
    else if (sort === "nome_asc") items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    else items.sort((a, b) => +new Date(b.listedAt) - +new Date(a.listedAt));
    const start = (page - 1) * pageSize;
    return json({
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
      featured: memory.nfts.find((n) => n.featured),
      meta: buildCatalogMeta(memory.nfts),
    });
  }),
  http.get(`${api}/nfts/:id`, async ({ params }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    const nft = memory.nfts.find((n) => n.id === params.id);
    if (!nft) return err(404, "NFT não encontrado", "not_found");
    return json({ nft, related: memory.nfts.filter((n) => n.id !== nft.id).slice(0, 5) });
  }),
  http.get(`${api}/nfts/:id/reviews`, async ({ params }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    if (memory.scenario === "reviews-fail") return err(500, "Não foi possível carregar as avaliações", "internal");
    const nft = memory.nfts.find((n) => n.id === params.id);
    if (!nft) return err(404, "NFT não encontrado", "not_found");
    const items = (memory.reviews ?? []).filter((r) => r.nftId === nft.id);
    return json({ items, total: items.length });
  }),
];

export const favoriteHandlers = [
  http.get(`${api}/favorites`, async () => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    if (memory.scenario === "unauthorized") return err(403, "Sem permissão", "forbidden");
    const ids = memory.favorites[memory.sessionUserId] ?? [];
    return json({ items: ids.map((id) => memory.nfts.find((n) => n.id === id)).filter(Boolean) });
  }),
  http.post(`${api}/favorites`, async ({ request }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    if (memory.scenario === "favorite-fail") return err(500, "Falha ao favoritar", "internal");
    const body = (await request.json()) as { nftId: string };
    const list = memory.favorites[memory.sessionUserId] ?? [];
    if (!list.includes(body.nftId)) list.push(body.nftId);
    memory.favorites[memory.sessionUserId] = list;
    return json({ items: list }, 201);
  }),
  http.delete(`${api}/favorites/:nftId`, async ({ params }) => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    memory.favorites[memory.sessionUserId] = (memory.favorites[memory.sessionUserId] ?? []).filter(
      (id) => id !== params.nftId,
    );
    saveState();
    return new HttpResponse(null, { status: 204 });
  }),
];

export const cartHandlers = [
  http.get(`${api}/cart`, async () => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    const cart = getCart();
    return json({ cart, quote: quoteCart(cart) });
  }),
  http.post(`${api}/cart/items`, async ({ request }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    const body = (await request.json()) as { nftId: string; editionId: string; quantity: number };
    try {
      const cart = addItem(body.nftId, body.editionId, Number(body.quantity ?? 1));
      return json({ cart, quote: quoteCart(cart) }, 201);
    } catch (e) {
      const errObj = e as { status?: number; message: string; code?: string };
      return err(errObj.status ?? 500, errObj.message, errObj.code ?? "error");
    }
  }),
  http.patch(`${api}/cart/items/:id`, async ({ params, request }) => {
    const cart = getCart();
    const body = (await request.json()) as { quantity: number };
    const item = cart.items.find((i) => i.id === params.id);
    if (!item) return err(404, "Item não encontrado", "not_found");
    if (body.quantity < 1) cart.items = cart.items.filter((i) => i.id !== params.id);
    else item.quantity = body.quantity;
    return json({ cart, quote: quoteCart(cart) });
  }),
  http.delete(`${api}/cart/items/:id`, async ({ params }) => {
    const cart = getCart();
    cart.items = cart.items.filter((i) => i.id !== params.id);
    return json({ cart, quote: quoteCart(cart) });
  }),
];

export const quoteHandlers = [
  http.post(`${api}/quote`, async ({ request }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    const body = (await request.json()) as { couponCode?: string; removeCoupon?: boolean };
    const cart = getCart();
    if (body.removeCoupon) cart.couponCode = null;
    else if (typeof body.couponCode === "string") cart.couponCode = body.couponCode;
    if (memory.scenario === "coupon-invalid") cart.couponCode = "INVALIDO";
    if (memory.scenario === "coupon-expired") cart.couponCode = "EXPIRADO";
    const quote = quoteCart(cart);
    if (quote.couponError === "invalid") return err(422, "Cupom inválido", "coupon_invalid");
    if (quote.couponError === "expired") return err(422, "Cupom expirado", "coupon_expired");
    return json({ quote, cart });
  }),
];

export const orderHandlers = [
  http.post(`${api}/orders`, async ({ request }) => {
    const blocked = await maybeDelay();
    if (blocked) return blocked;
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    const key = request.headers.get("Idempotency-Key");
    if (!key) return err(422, "Informe o cabeçalho Idempotency-Key", "missing_idempotency_key");
    const body = (await request.json()) as { quoteId: string; walletId: string; network: Order["network"] };
    const hash = JSON.stringify(body);
    const existing = memory.idempotency.find((i) => i.key === key && i.userId === memory.sessionUserId);
    if (existing) {
      if (existing.hash !== hash) return err(409, "Chave de idempotência em conflito", "idempotency_conflict");
      const order = memory.orders.find((o) => o.id === existing.orderId);
      return json({ order }, 201);
    }
    const quote = memory.quotes.find((q) => q.id === body.quoteId);
    if (!quote) return err(422, "Cotação inválida", "invalid_quote");
    if (quote.stale || memory.scenario === "price-changed") {
      return err(409, "Cotação desatualizada. Confirme os novos valores.", "stale_quote");
    }
    const cart = getCart();
    const refuse = memory.scenario === "payment-refused";
    const timeout = memory.scenario === "timeout-order";
    const order: Order = {
      id: `order-${Date.now()}`,
      userId: memory.sessionUserId,
      status: refuse ? "recusado" : timeout ? "pendente" : "confirmado",
      items: cart.items.map((i) => ({
        nftId: i.nftId,
        editionId: i.editionId,
        name: i.name,
        image: i.image,
        tokenId: i.tokenId,
        editionLabel: i.editionLabel,
        quantity: i.quantity,
        unitPriceEth: i.unitPriceEth,
        lineTotalEth: new Decimal(i.unitPriceEth).times(i.quantity).toFixed(),
      })),
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      network: body.network,
      walletId: body.walletId,
      walletLabel: "MetaMask",
      txId: refuse || timeout ? null : `0xKURIO${Date.now().toString(16).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    memory.orders.push(order);
    memory.idempotency.push({ key, userId: memory.sessionUserId, hash, orderId: order.id });
    if (order.status === "confirmado") cart.items = [];
    return json({ order }, 201);
  }),
  http.get(`${api}/orders/:id`, async ({ params }) => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    const order = memory.orders.find((o) => o.id === params.id);
    if (!order) return err(404, "Pedido não encontrado", "not_found");
    if (order.userId !== memory.sessionUserId) return err(403, "Sem permissão para este pedido", "forbidden");
    return json({ order });
  }),
];

export const profileHandlers = [
  http.get(`${api}/profile`, async () => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    const user = memory.users.find((u) => u.id === memory.sessionUserId);
    return json({ user: user ? publicUser(user) : null });
  }),
  http.patch(`${api}/profile`, async ({ request }) => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    const user = memory.users.find((u) => u.id === memory.sessionUserId)!;
    Object.assign(user, await request.json());
    return json({ user: publicUser(user) });
  }),
  http.post(`${api}/profile/avatar`, async () => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    const user = memory.users.find((u) => u.id === memory.sessionUserId)!;
    user.avatarUrl = svgDot();
    return json({ user: publicUser(user) });
  }),
  http.patch(`${api}/profile/password`, async ({ request }) => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    const body = (await request.json()) as { currentPassword: string; newPassword: string; confirmPassword?: string };
    const user = memory.users.find((u) => u.id === memory.sessionUserId)!;
    if (!checkPassword(user, body.currentPassword)) {
      return err(422, "Senha atual incorreta", "validation", { currentPassword: "Senha atual incorreta" });
    }
    if (body.newPassword.length < 8) {
      return err(422, "A nova senha deve ter ao menos 8 caracteres", "validation", {
        newPassword: "A nova senha deve ter ao menos 8 caracteres",
      });
    }
    user.password = `hashed:${body.newPassword}`;
    return new HttpResponse(null, { status: 204 });
  }),
];

function svgDot() {
  return "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='#E08A3A'/></svg>");
}

export const walletHandlers = [
  http.get(`${api}/wallets`, async () => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    return json({ items: memory.wallets.filter((w) => w.userId === memory.sessionUserId) });
  }),
  http.post(`${api}/wallets`, async ({ request }) => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    const body = (await request.json()) as Omit<import("@/types").Wallet, "id" | "userId">;
    if (!body.displayName || !body.address || !body.email) {
      return err(422, "Dados inválidos", "validation", { displayName: "Campo obrigatório" });
    }
    const wallet = { ...body, id: `wallet-${Date.now()}`, userId: memory.sessionUserId };
    memory.wallets.push(wallet);
    return json({ wallet }, 201);
  }),
  http.patch(`${api}/wallets/:id`, async ({ params, request }) => {
    if (!memory.sessionUserId) return err(401, "Sessão inválida. Entre novamente.", "unauthenticated");
    const wallet = memory.wallets.find((w) => w.id === params.id && w.userId === memory.sessionUserId);
    if (!wallet) return err(404, "Carteira não encontrada", "not_found");
    Object.assign(wallet, await request.json());
    return json({ wallet });
  }),
];

export const debugHandlers = [
  http.post(`${api}/debug/reset`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { scenario?: string };
    resetState(body.scenario ?? "default");
    return json({ scenario: memory.scenario });
  }),
];

export const handlers = [
  ...sessionHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...debugHandlers,
];
