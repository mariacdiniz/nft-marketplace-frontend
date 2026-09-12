import { Link, Outlet, useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { Heart, Home, ScanLine, Search, ShoppingBag, SlidersHorizontal, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { useSession } from "@/features/auth/use-session";
import { useRealtime } from "@/features/realtime/use-realtime";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import type { Cart } from "@/types";
import { DebugPanel } from "@/features/realtime/debug-panel";
import { SiteFooter } from "@/shared/ui/site-footer";
import { SearchDialog } from "@/features/catalog/search-dialog";
import { cn } from "@/shared/utils/eth";

export function RootLayout() {
  const { data } = useSession();
  useRealtime(data?.user?.id);
  const navigate = useNavigate();
  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.get<{ cart: Cart }>("/cart")).data,
  });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qty = cart.data?.cart.items.reduce((a, i) => a + i.quantity, 0) ?? 0;
  const onHome = pathname === "/";
  const mercadoActive = ["/nft", "/cart", "/checkout"].some((p) => pathname.startsWith(p));
  const confirmation = pathname.includes("confirmation");
  const mobileSlim = ["/cart", "/checkout"].includes(pathname) || pathname.startsWith("/nft/") || pathname === "/login" || pathname === "/register";
  const [searchOpen, setSearchOpen] = useState(false);
  const [navNotice, setNavNotice] = useState<string | null>(null);

  const goMercado = () => {
    void navigate({ to: "/", search: {}, hash: "catalogo" });
    window.setTimeout(() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const soon = (label: string) => {
    setNavNotice(`${label}: disponível em breve`);
    window.setTimeout(() => setNavNotice(null), 2500);
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-kurio-cream">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 bg-kurio-orange px-3 py-2 text-black">
        Pular para o conteúdo
      </a>
      <header className={cn("border-b border-line", mobileSlim && "hidden md:block")}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-display text-xl tracking-[0.28em] text-kurio-cream">
            KURIO
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Principal">
            <Link to="/" className={onHome && !mercadoActive ? "text-kurio-orange" : "text-kurio-muted hover:text-kurio-cream"}>
              Início
              {onHome && !mercadoActive ? <span className="mx-auto mt-1 block h-0.5 w-8 bg-kurio-orange" /> : null}
            </Link>
            <button
              type="button"
              className={mercadoActive ? "text-kurio-orange" : "text-kurio-muted hover:text-kurio-cream"}
              onClick={goMercado}
            >
              Mercado
              {mercadoActive ? <span className="mx-auto mt-1 block h-0.5 w-8 bg-kurio-orange" /> : null}
            </button>
            <button type="button" className="text-kurio-muted hover:text-kurio-cream" onClick={() => soon("Criadores")}>
              Criadores
            </button>
            <button type="button" className="text-kurio-muted hover:text-kurio-cream" onClick={() => soon("Aprenda")}>
              Aprenda
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Buscar" className="text-kurio-muted hover:text-kurio-cream" onClick={() => setSearchOpen(true)}>
              <Search size={18} />
            </button>
            <Link to="/cart" aria-label={`Carrinho, ${qty} itens`} className="relative text-kurio-muted hover:text-kurio-cream">
              <ShoppingBag size={18} />
              {qty > 0 ? (
                <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-kurio-orange px-1 text-[10px] text-black">
                  {qty}
                </span>
              ) : null}
            </Link>
            {data?.user ? (
              <Link to="/account/profile" aria-label="Perfil" className="text-kurio-muted hover:text-kurio-cream">
                <UserRound size={18} />
              </Link>
            ) : (
              <Button asChild className="rounded-md px-3">
                <Link to="/login">
                  <UserRound size={14} className="mr-1" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <div id="conteudo">
        <Outlet />
      </div>
      {!confirmation ? (
        <div className={mobileSlim ? "hidden md:block" : undefined}>
          <SiteFooter />
        </div>
      ) : null}
      <nav
        className={cn(
          "fixed bottom-3 left-1/2 z-40 flex w-[min(92vw,420px)] -translate-x-1/2 items-center justify-around rounded-full border border-line bg-[#1c1511]/95 py-3 md:hidden",
          mobileSlim && "hidden",
        )}
        aria-label="Navegação mobile"
      >
        <Link to="/" aria-label="Início">
          <Home size={20} />
        </Link>
        <Link to="/login" search={{ redirect: "/" }} aria-label="Favoritos">
          <Heart size={20} />
        </Link>
        <button type="button" className="grid h-12 w-12 -mt-8 place-items-center rounded-full bg-kurio-orange text-black" aria-label="Buscar NFTs" onClick={() => setSearchOpen(true)}>
          <ScanLine size={22} />
        </button>
        <Link to="/cart" aria-label="Carrinho">
          <ShoppingBag size={20} />
        </Link>
        <Link to="/account/profile" aria-label="Conta">
          <UserRound size={20} />
        </Link>
      </nav>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      {navNotice ? (
        <p className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-card px-4 py-2 text-sm text-kurio-cream shadow-lg md:bottom-6">
          {navNotice}
        </p>
      ) : null}
      <DebugPanel />
    </div>
  );
}

export function MobileSearchBar() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { q?: string };
  const [q, setQ] = useState(search.q ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    void navigate({ to: "/", search: { q: term || undefined, page: "1" }, hash: "catalogo" });
  };

  return (
    <form className="mb-4 flex gap-2 md:hidden" onSubmit={submit}>
      <label className="sr-only" htmlFor="explorar">
        Explorar coleções
      </label>
      <div className="flex h-12 flex-1 items-center gap-2 rounded-2xl bg-card px-4">
        <Search size={18} className="text-kurio-muted" />
        <input
          id="explorar"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Explorar coleções"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      <button type="submit" aria-label="Buscar" className="grid h-12 w-12 place-items-center rounded-2xl bg-kurio-orange text-black">
        <SlidersHorizontal size={18} />
      </button>
    </form>
  );
}
