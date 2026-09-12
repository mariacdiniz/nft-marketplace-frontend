import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { HomePage } from "./routes/index";
import { NftDetailPage } from "./routes/nft.$nftId";
import { CartPage } from "./routes/cart";
import { CheckoutPage } from "./routes/checkout";
import { ConfirmationPage } from "./routes/orders.$orderId.confirmation";
import { LoginPage } from "./routes/login";
import { RegisterPage } from "./routes/register";
import { AccountLayout } from "./routes/account/layout";
import { ProfilePage } from "./routes/account/profile";
import { WalletsPage } from "./routes/account/wallets";
import { api } from "./shared/api/client";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
  validateSearch: (s: Record<string, unknown>) => s,
});

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nft/$nftId",
  component: NftDetailPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

async function requireSession() {
  try {
    const { data } = await api.get<{ user: { id: string } | null }>("/session");
    if (!data.user) throw redirect({ to: "/login", search: { redirect: window.location.pathname } });
  } catch (err) {
    if (err && typeof err === "object" && "to" in err) throw err;
    throw redirect({ to: "/login" });
  }
}

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  beforeLoad: requireSession,
  component: CheckoutPage,
});

const confirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId/confirmation",
  beforeLoad: requireSession,
  component: ConfirmationPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => s,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
  validateSearch: (s: Record<string, unknown>) => s,
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  beforeLoad: requireSession,
  component: AccountLayout,
});

const profileRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: "/profile",
  component: ProfilePage,
});

const walletsRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: "/wallets",
  component: WalletsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  nftRoute,
  cartRoute,
  checkoutRoute,
  confirmationRoute,
  loginRoute,
  registerRoute,
  accountRoute.addChildren([profileRoute, walletsRoute]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
