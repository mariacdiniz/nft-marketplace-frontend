import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { apiMode } from "@/shared/api/client";
import type { Nft, Order } from "@/types";

const seen = new Map<string, number>();

export function useRealtime(userId: string | null | undefined) {
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = apiMode() === "msw" ? window.location.origin : (import.meta.env.VITE_WS_URL as string);
    const socket = io(url, {
      transports: ["websocket"],
      auth: { userId: userId ?? "" },
    });
    socketRef.current = socket;

    const accept = (id: string, version: number) => {
      const prev = seen.get(id) ?? 0;
      if (version <= prev) return false;
      seen.set(id, version);
      return true;
    };

    socket.on("nft.updated", (event: { resourceId: string; version: number; nft: Nft }) => {
      if (!accept(event.resourceId, event.version)) return;
      qc.setQueriesData({ queryKey: ["nfts"] }, (old: unknown) => old);
      qc.invalidateQueries({ queryKey: ["nfts"] });
      qc.invalidateQueries({ queryKey: ["nft", event.resourceId] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    });

    socket.on("order.updated", (event: { resourceId: string; version: number; order: Order }) => {
      if (!accept(event.resourceId, event.version)) return;
      qc.setQueryData(["order", event.resourceId], { order: event.order });
      qc.invalidateQueries({ queryKey: ["order", event.resourceId] });
    });

    socket.on("connect", () => {
      qc.invalidateQueries();
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [qc, userId]);

  return socketRef;
}
