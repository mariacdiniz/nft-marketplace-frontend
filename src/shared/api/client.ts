import axios, { type AxiosError } from "axios";
import type { ApiErrorBody } from "@/types";

export const apiMode = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("api") === "live") return "live";
  if (params.get("api") === "msw") return "msw";
  const mode = String(import.meta.env.VITE_API_MODE ?? "msw").trim().toLowerCase();
  return mode === "live" ? "live" : "msw";
};

export const apiBaseUrl = () => {
  if (apiMode() === "msw") return "/api";
  return String(import.meta.env.VITE_API_URL ?? "http://localhost:3333").trim().replace(/\/$/, "");
};

export const wsUrl = () => {
  if (apiMode() === "msw") return window.location.origin;
  return String(import.meta.env.VITE_WS_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:3333")
    .trim()
    .replace(/\/$/, "");
};

export const api = axios.create({
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  config.baseURL = apiBaseUrl();
  return config;
});

export function apiError(err: unknown): ApiErrorBody["error"] {
  const ax = err as AxiosError<ApiErrorBody>;
  return (
    ax.response?.data?.error ?? {
      code: "network",
      message: "Falha de conexão. Tente novamente.",
    }
  );
}

/** Converte paths da API (.jpg) para os assets reais do front (.svg). */
export function mediaUrl(src: string | null | undefined): string {
  if (!src) return "";
  try {
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
      const url = new URL(src, window.location.origin);
      url.pathname = url.pathname.replace(/\.jpe?g$/i, ".svg");
      // Se a API apontou para o backend, usa o mesmo path no front (onde estão os SVGs).
      if (url.pathname.startsWith("/nfts/")) return `${url.pathname}${url.search}${url.hash}`;
      return url.toString();
    }
  } catch {
    /* fall through */
  }
  return src.replace(/\.jpe?g$/i, ".svg");
}
