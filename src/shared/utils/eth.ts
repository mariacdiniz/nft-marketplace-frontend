import Decimal from "decimal.js";

Decimal.set({ precision: 40 });

export function formatEth(value: string): string {
  return `${new Decimal(value).toFixed()} ETH`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
