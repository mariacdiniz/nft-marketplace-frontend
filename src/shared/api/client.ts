import axios, { type AxiosError } from "axios";
import type { ApiErrorBody } from "@/types";

export const apiMode = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("api") === "live") return "live";
  return (import.meta.env.VITE_API_MODE as string | undefined) ?? "msw";
};

export const apiBaseUrl = () => {
  if (apiMode() === "msw") return "/api";
  return (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3333";
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
