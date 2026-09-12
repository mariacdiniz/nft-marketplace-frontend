export type EthString = string;
export type OrderStatus = "pendente" | "confirmado" | "recusado";
export type Network = "ethereum" | "polygon" | "solana";
export type NftStatus = "disponivel" | "esgotado" | "em_alta" | "novo";

export interface NftEdition {
  id: string;
  label: string;
  supply: number;
  remaining: number;
  available: boolean;
}

export interface Nft {
  id: string;
  slug: string;
  name: string;
  description: string;
  collection: string;
  category: string;
  network: Network;
  priceEth: EthString;
  previousPriceEth?: EthString;
  images: string[];
  attributes: string[];
  tokenId: string;
  rating: number;
  ratingCount: number;
  editions: NftEdition[];
  status: NftStatus;
  listedAt: string;
  featured: boolean;
  version: number;
  updatedAt: string;
}

export interface NftReview {
  id: string;
  nftId: string;
  authorName: string;
  authorHandle: string;
  avatarUrl: string | null;
  rating: number;
  createdAt: string;
  comment: string;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  displayName: string;
  ensName: string;
  walletNickname: string;
  avatarUrl: string | null;
}

export interface CartItem {
  id: string;
  nftId: string;
  editionId: string;
  quantity: number;
  unitPriceEth: EthString;
  name: string;
  image: string;
  tokenId: string;
  editionLabel: string;
}

export interface Cart {
  id: string;
  ownerKey: string;
  items: CartItem[];
  couponCode: string | null;
}

export interface QuoteLine {
  nftId: string;
  editionId: string;
  quantity: number;
  unitPriceEth: EthString;
  lineTotalEth: EthString;
  name: string;
  available: boolean;
  priceChanged: boolean;
}

export interface Quote {
  id: string;
  subtotalEth: EthString;
  discountEth: EthString;
  discountLabel: string | null;
  networkFeeEth: EthString;
  totalEth: EthString;
  couponCode: string | null;
  couponError: "invalid" | "expired" | null;
  lines: QuoteLine[];
  stale: boolean;
  quotedAt: string;
}

export interface OrderItemSnapshot {
  nftId: string;
  editionId: string;
  name: string;
  image: string;
  tokenId: string;
  editionLabel: string;
  quantity: number;
  unitPriceEth: EthString;
  lineTotalEth: EthString;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotalEth: EthString;
  discountEth: EthString;
  networkFeeEth: EthString;
  totalEth: EthString;
  network: Network;
  walletId: string;
  walletLabel: string;
  txId: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Wallet {
  id: string;
  userId: string;
  role: "principal" | "secundaria";
  displayName: string;
  nickname: string;
  network: Network;
  address: string;
  type: "metamask" | "walletconnect" | "coinbase" | "custodial";
  email: string;
  ensName: string;
  referralCode: string;
  secondaryAddress?: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface CatalogResponse {
  items: Nft[];
  total: number;
  page: number;
  pageSize: number;
  featured?: Nft;
  meta: {
    categories: { name: string; count: number }[];
    networks: { id: Network; label: string; count: number }[];
    priceMin: string;
    priceMax: string;
  };
}
