import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import { memory, loadState, saveState } from "./engine";

const socketLink = ws.link(/.*/);

export const socketHandlers = [
  socketLink.addEventListener("connection", (connection) => {
    loadState();
    const io = toSocketIo(connection);
    io.client.on("debug:nft.updated", (_event: unknown, payload: { nftId: string; priceEth?: string }) => {
      const nft = memory.nfts.find((n) => n.id === payload.nftId);
      if (!nft) return;
      if (payload.priceEth) {
        nft.previousPriceEth = nft.priceEth;
        nft.priceEth = payload.priceEth;
      }
      nft.version += 1;
      nft.updatedAt = new Date().toISOString();
      saveState();
      const event = {
        type: "nft.updated" as const,
        resourceId: nft.id,
        version: nft.version,
        timestamp: nft.updatedAt,
        nft,
      };
      io.client.emit("nft.updated", event);
    });
    io.client.on("debug:order.updated", (_event: unknown, payload: { orderId: string; status: "confirmado" | "recusado" }) => {
      const order = memory.orders.find((o) => o.id === payload.orderId);
      if (!order) return;
      if (order.status === "confirmado" || order.status === "recusado") return;
      order.status = payload.status;
      order.version += 1;
      order.updatedAt = new Date().toISOString();
      if (payload.status === "confirmado") order.txId = `0xKURIO${Date.now().toString(16).toUpperCase()}`;
      saveState();
      io.client.emit("order.updated", {
        type: "order.updated",
        resourceId: order.id,
        version: order.version,
        timestamp: order.updatedAt,
        order,
      });
    });
  }),
];
