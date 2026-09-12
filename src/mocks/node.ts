import { setupServer } from "msw/node";
import { handlers } from "./handlers";
import { socketHandlers } from "./socket-handlers";

export const server = setupServer(...handlers, ...socketHandlers);
