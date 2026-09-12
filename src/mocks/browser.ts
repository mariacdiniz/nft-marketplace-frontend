import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { socketHandlers } from "./socket-handlers";
import { loadState, resetState } from "./engine";

export async function startMsw() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") === "1") resetState(params.get("scenario") ?? "default");
  else loadState();
  if (params.get("scenario")) {
    resetState(params.get("scenario") ?? "default");
  }
  const worker = setupWorker(...handlers, ...socketHandlers);
  await worker.start({ onUnhandledRequest: "bypass", serviceWorker: { url: "/mockServiceWorker.js" } });
}

export { resetState };
