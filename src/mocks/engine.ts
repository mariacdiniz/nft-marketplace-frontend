import Decimal from "decimal.js";
import type { Cart, CartItem, Nft, NftReview, Order, Quote, UserPublic, Wallet } from "@/types";
import { applyReviewStats, buildReviews } from "./fixtures/reviews";

const KEY = "kurio-msw-state-v4";

export interface MockUser extends UserPublic {
  password: string;
}

export interface MockState {
  nfts: Nft[];
  users: MockUser[];
  sessionUserId: string | null;
  guestKey: string;
  carts: Cart[];
  favorites: Record<string, string[]>;
  wallets: Wallet[];
  orders: Order[];
  quotes: Quote[];
  reviews: NftReview[];
  idempotency: { key: string; userId: string; hash: string; orderId: string }[];
  scenario: string;
  latencyMs: number;
  seenEvents: string[];
}

const portraits = ["green", "purple", "white", "gold", "phones"] as const;

function svgPortrait(kind: string, seed: string): string {
  const colors: Record<string, [string, string]> = {
    green: ["#2f6b3a", "#c9a227"],
    purple: ["#6b4aa8", "#8d7a4a"],
    white: ["#d9d2c5", "#1c1c1c"],
    gold: ["#d4a017", "#5a3a12"],
    phones: ["#c47a22", "#222"],
  };
  const [a, b] = colors[kind] ?? colors.green!;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect fill='#e8d9b8' width='400' height='400'/><circle cx='200' cy='190' r='110' fill='#6b4a32'/><circle cx='165' cy='175' r='18' fill='#111'/><circle cx='235' cy='175' r='18' fill='#111'/><rect x='120' y='250' width='160' height='90' rx='20' fill='${a}'/><circle cx='200' cy='40' r='20' fill='${b}'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}#${seed}`;
}

function buildNfts(): Nft[] {
  const rows: Array<[string, string, string, string]> = [
    ["Emerald Ape", "042", "1.19", "Colecionáveis"],
    ["Sage Nomad", "089", "1.69", "Arte digital"],
    ["Neon Vessel", "052", "1.99", "Arte 3D"],
    ["Cosmic Bloom", "118", "1.29", "Generativa"],
    ["Violet Nomad", "314", "1.39", "Arte digital"],
    ["Ivory Baron", "088", "1.79", "Colecionáveis"],
    ["Golden Beat", "207", "0.99", "Música"],
    ["Golden Frequency", "071", "0.49", "Música"],
    ["Golden Signal", "168", "0.39", "Utilidade"],
    ["Amber Scout", "021", "2.10", "Fotografia"],
    ["Crimson Pilot", "077", "3.40", "Jogos"],
    ["Azure Monk", "133", "0.88", "Arquitetura"],
    ["Jade Courier", "201", "1.05", "Arte 3D"],
    ["Obsidian Duke", "009", "4.20", "Colecionáveis"],
    ["Pearl Diver", "256", "0.72", "Fotografia"],
    ["Cobalt Fox", "064", "1.44", "Jogos"],
    ["Sunset Marshal", "018", "2.55", "Arte digital"],
    ["Moss Captain", "303", "1.11", "Generativa"],
    ["Ivory Lyric", "190", "0.61", "Música"],
    ["Volt Oracle", "044", "2.22", "Utilidade"],
    ["Brick Architect", "112", "1.33", "Arquitetura"],
    ["Lagoon Sprite", "278", "0.95", "Generativa"],
    ["Copper Knight", "055", "2.80", "Jogos"],
    ["Mist Scholar", "147", "1.08", "Arte digital"],
  ];
  return rows.map((row, index) => {
    const [title, token, price, category] = row;
    const id = `nft-${String(index + 1).padStart(3, "0")}`;
    const img = svgPortrait(portraits[index % portraits.length]!, id);
    const remaining = index === 4 ? 1 : 50 - (index % 7);
    return {
      id,
      slug: id,
      name: `${title} #${token}`,
      description:
        index === 0
          ? "Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Ethereum."
          : `Peça ${title} da coleção Kurio Editions.`,
      collection: "Kurio Apes",
      category,
      network: (["ethereum", "polygon", "solana"] as const)[index % 3]!,
      priceEth: price,
      previousPriceEth: title === "Neon Vessel" ? "2.29" : undefined,
      images: [img, img, img, img],
      attributes: index === 0 ? ["Óculos", "Esmeralda", "Raro"] : ["Kurio", category],
      tokenId: `#${token.padStart(4, "0")}`,
      rating: 4.8,
      ratingCount: 19,
      editions: [
        { id: `${id}-ed-1`, label: "1/1", supply: 1, remaining: index === 0 ? 1 : 0, available: index === 0 },
        { id: `${id}-ed-10`, label: "1/10", supply: 10, remaining: 8, available: true },
        { id: `${id}-ed-50`, label: "1/50", supply: 50, remaining, available: remaining > 0 },
        { id: `${id}-ed-open`, label: "ABERTA", supply: 9999, remaining: 9999, available: true },
      ],
      status: index < 3 ? "novo" : index % 5 === 0 ? "em_alta" : "disponivel",
      listedAt: new Date(Date.UTC(2026, 5, 1 + index)).toISOString(),
      featured: index === 0,
      version: 1,
      updatedAt: new Date(Date.UTC(2026, 5, 1 + index)).toISOString(),
    };
  });
}

function seed(scenario: string): MockState {
  const nfts = buildNfts();
  const reviews = buildReviews(nfts.map((n) => n.id));
  applyReviewStats(nfts, reviews);
  const ana: MockUser = {
    id: "user-ana",
    email: "ana@kurio.dev",
    username: "ana.kurio",
    displayName: "Ana Colecionadora",
    ensName: "ana.kurio.eth",
    walletNickname: "Principal",
    avatarUrl: null,
    password: "hashed:Colecionador@123",
  };
  const bruno: MockUser = {
    id: "user-bruno",
    email: "bruno@kurio.dev",
    username: "bruno.kurio",
    displayName: "Bruno Colecionador",
    ensName: "bruno.kurio.eth",
    walletNickname: "Reserva",
    avatarUrl: null,
    password: "hashed:Colecionador@123",
  };
  return {
    nfts: scenario === "empty" ? [] : nfts,
    users: [ana, bruno],
    sessionUserId: null,
    guestKey: "guest-msw",
    carts: [
      { id: "cart-guest", ownerKey: "guest-msw", items: [], couponCode: null },
      { id: "cart-ana", ownerKey: "user:user-ana", items: [], couponCode: null },
      { id: "cart-bruno", ownerKey: "user:user-bruno", items: [], couponCode: null },
    ],
    favorites: { "user-ana": [nfts[0]?.id ?? "nft-001"], "user-bruno": [] },
    wallets: [
      {
        id: "wallet-ana-1",
        userId: "user-ana",
        role: "principal",
        displayName: "Principal",
        nickname: "Principal",
        network: "ethereum",
        address: "0xA91F_E82C",
        type: "metamask",
        email: ana.email,
        ensName: ana.ensName,
        referralCode: "ANA-KURIO",
      },
      {
        id: "wallet-bruno-1",
        userId: "user-bruno",
        role: "principal",
        displayName: "Reserva",
        nickname: "Reserva",
        network: "polygon",
        address: "nova.kurio.eth",
        type: "coinbase",
        email: bruno.email,
        ensName: bruno.ensName,
        referralCode: "BRUNO-KURIO",
      },
    ],
    orders: [],
    quotes: [],
    reviews: scenario === "empty" ? [] : reviews,
    idempotency: [],
    scenario,
    latencyMs: scenario === "latency" ? 1200 : 0,
    seenEvents: [],
  };
}

let memory = seed("default");

export function loadState(): MockState {
  try {
    if (typeof localStorage === "undefined") return memory;
    const raw = localStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw) as MockState;
  } catch {
    /* ignore */
  }
  return memory;
}

export function saveState(): void {
  memory = { ...memory };
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* ignore */
  }
}

export function resetState(scenario = "default"): MockState {
  memory = seed(scenario);
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const qs = params.get("scenario");
  if (qs) memory.scenario = qs;
  if (memory.scenario === "latency") memory.latencyMs = 1200;
  if (memory.scenario === "empty") memory.nfts = [];
  saveState();
  return memory;
}

export function ownerKey(): string {
  return memory.sessionUserId ? `user:${memory.sessionUserId}` : memory.guestKey;
}

export function getCart(): Cart {
  let cart = memory.carts.find((c) => c.ownerKey === ownerKey());
  if (!cart) {
    cart = { id: `cart-${ownerKey()}`, ownerKey: ownerKey(), items: [], couponCode: null };
    memory.carts.push(cart);
  }
  return cart;
}

export function publicUser(u: MockUser): UserPublic {
  const { password: _p, ...rest } = u;
  return rest;
}

export function quoteCart(cart: Cart): Quote {
  const lines = cart.items.map((item) => {
    const nft = memory.nfts.find((n) => n.id === item.nftId);
    const edition = nft?.editions.find((e) => e.id === item.editionId);
    const unit = nft?.priceEth ?? item.unitPriceEth;
    return {
      nftId: item.nftId,
      editionId: item.editionId,
      quantity: item.quantity,
      unitPriceEth: unit,
      lineTotalEth: new Decimal(unit).times(item.quantity).toFixed(),
      name: nft?.name ?? item.name,
      available: Boolean(edition?.available && edition.remaining >= item.quantity),
      priceChanged: Boolean(nft && nft.priceEth !== item.unitPriceEth),
    };
  });
  const subtotal = lines.reduce((a, l) => a.plus(l.lineTotalEth), new Decimal(0));
  let discount = new Decimal(0);
  let couponError: Quote["couponError"] = null;
  let discountLabel: string | null = null;
  const code = cart.couponCode;
  if (code === "EXPIRADO") couponError = "expired";
  else if (code && code !== "LANCAMENTO" && code !== "KURIO10") couponError = "invalid";
  else if (code === "LANCAMENTO") {
    discount = new Decimal("0.08");
    discountLabel = "Desconto de lançamento";
  } else if (code === "KURIO10") {
    discount = subtotal.times(0.1);
    discountLabel = "Desconto de lançamento";
  }
  const fee = new Decimal("0.016");
  const quote: Quote = {
    id: `quote-${Date.now()}`,
    subtotalEth: subtotal.toFixed(),
    discountEth: discount.toFixed(),
    discountLabel,
    networkFeeEth: fee.toFixed(),
    totalEth: Decimal.max(subtotal.minus(discount).plus(fee), 0).toFixed(),
    couponCode: couponError ? null : code,
    couponError,
    lines,
    stale: lines.some((l) => l.priceChanged || !l.available),
    quotedAt: new Date().toISOString(),
  };
  memory.quotes.push(quote);
  return quote;
}

export { memory };

export function checkPassword(user: MockUser, password: string): boolean {
  return user.password === `hashed:${password}`;
}

export function mergeGuest(userId: string): void {
  const guest = memory.carts.find((c) => c.ownerKey === memory.guestKey);
  const userCart = memory.carts.find((c) => c.ownerKey === `user:${userId}`);
  if (!guest || !userCart) return;
  for (const item of guest.items) {
    const existing = userCart.items.find((i) => i.nftId === item.nftId && i.editionId === item.editionId);
    if (existing) existing.quantity += item.quantity;
    else userCart.items.push({ ...item, id: `ci-${Date.now()}` });
  }
  guest.items = [];
}

export function addItem(nftId: string, editionId: string, quantity: number): Cart {
  const nft = memory.nfts.find((n) => n.id === nftId);
  if (!nft) throw Object.assign(new Error("NFT não encontrado"), { status: 404, code: "not_found" });
  const edition = nft.editions.find((e) => e.id === editionId);
  if (!edition?.available) throw Object.assign(new Error("Edição indisponível"), { status: 409, code: "edition_unavailable" });
  const cart = getCart();
  const existing = cart.items.find((i) => i.nftId === nftId && i.editionId === editionId);
  if (existing) existing.quantity += quantity;
  else {
    const item: CartItem = {
      id: `ci-${Date.now()}`,
      nftId,
      editionId,
      quantity,
      unitPriceEth: nft.priceEth,
      name: nft.name,
      image: nft.images[0] ?? "",
      tokenId: nft.tokenId,
      editionLabel: edition.label,
    };
    cart.items.push(item);
  }
  return cart;
}

const CATEGORY_ORDER = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Colecionáveis",
  "Generativa",
  "Jogos",
  "Arquitetura",
  "Utilidade",
] as const;

export function buildCatalogMeta(nfts: Nft[]) {
  const categories = CATEGORY_ORDER.map((name) => ({
    name,
    count: nfts.filter((n) => n.category === name).length,
  })).filter((c) => c.count > 0);

  const networkLabels = {
    ethereum: "Ethereum",
    polygon: "Polygon",
    solana: "Solana",
  } as const;

  const networks = (["ethereum", "polygon", "solana"] as const).map((id) => ({
    id,
    label: networkLabels[id],
    count: nfts.filter((n) => n.network === id).length,
  }));

  const prices = nfts.map((n) => Number(n.priceEth));
  const priceMin = prices.length ? String(Math.min(...prices)) : "0";
  const priceMax = prices.length ? String(Math.max(...prices)) : "0";

  return { categories, networks, priceMin, priceMax };
}

export const catalogMeta = buildCatalogMeta(buildNfts());
