import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { api, mediaUrl } from "@/shared/api/client";
import { formatEth } from "@/shared/utils/eth";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { MobileSearchBar } from "@/routes/__root";
import type { CatalogResponse } from "@/types";

export function HomePage() {
  const search = useSearch({ strict: false }) as {
    q?: string;
    category?: string;
    network?: string;
    sort?: string;
    tab?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
  };
  const navigate = useNavigate();
  const page = Number(search.page ?? 1);
  const query = useQuery({
    queryKey: ["nfts", search],
    queryFn: async () => (await api.get<CatalogResponse>("/nfts", { params: { ...search, page } })).data,
  });

  const metaMin = query.data?.meta.priceMin ?? "0.39";
  const metaMax = query.data?.meta.priceMax ?? "4.20";
  const [minDraft, setMinDraft] = useState(search.minPrice ?? metaMin);
  const [maxDraft, setMaxDraft] = useState(search.maxPrice ?? metaMax);

  useEffect(() => {
    setMinDraft(search.minPrice ?? query.data?.meta.priceMin ?? metaMin);
    setMaxDraft(search.maxPrice ?? query.data?.meta.priceMax ?? metaMax);
  }, [search.minPrice, search.maxPrice, query.data?.meta.priceMin, query.data?.meta.priceMax, metaMin, metaMax]);

  const setParam = (patch: Record<string, string | undefined>) => {
    const resetsPage = ["q", "category", "network", "sort", "tab", "minPrice", "maxPrice"].some((k) => k in patch);
    void navigate({
      to: "/",
      search: {
        ...search,
        ...patch,
        page: patch.page ?? (resetsPage ? "1" : search.page),
      },
      hash: "catalogo",
    });
  };

  const applyPrice = () => {
    const min = minDraft.trim().replace(",", ".");
    const max = maxDraft.trim().replace(",", ".");
    if (!min || !max || Number.isNaN(Number(min)) || Number.isNaN(Number(max))) return;
    const low = Math.min(Number(min), Number(max));
    const high = Math.max(Number(min), Number(max));
    setParam({ minPrice: String(low), maxPrice: String(high) });
  };

  const clearPrice = () => {
    setMinDraft(metaMin);
    setMaxDraft(metaMax);
    setParam({ minPrice: undefined, maxPrice: undefined });
  };

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.pageSize ?? 9)));

  if (query.isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p>Não foi possível carregar o catálogo.</p>
        <Button className="mt-4" onClick={() => query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 md:py-8">
      <MobileSearchBar />
      <section className="mb-6 rounded-3xl bg-card p-4 md:hidden">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-kurio-muted">Bem-vindo à Kurio</p>
            <h1 className="font-display text-4xl leading-[0.9]">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </h1>
            <p className="mt-2 text-xs text-kurio-muted">Descubra NFTs selecionados de criadores do mundo todo.</p>
            <button type="button" className="mt-3 text-sm text-kurio-orange" onClick={() => document.getElementById("catalogo")?.scrollIntoView()}>
              EXPLORAR →
            </button>
          </div>
          <img src={mediaUrl(query.data?.featured?.images[0])} alt="" className="h-24 w-24 rounded-2xl object-cover" />
        </div>
      </section>
      <section className="hidden items-center gap-8 md:grid md:grid-cols-2">
        <div>
          <p className="text-sm text-kurio-muted">Bem-vindo à Kurio</p>
          <h1 className="font-display text-5xl leading-[0.9] tracking-wide md:text-6xl">
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </h1>
          <p className="mt-4 max-w-md text-sm text-kurio-muted">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e faça
            parte da cultura da internet.
          </p>
          <Button className="mt-6" onClick={() => document.getElementById("catalogo")?.scrollIntoView()}>
            EXPLORAR
          </Button>
        </div>
        {query.isLoading ? (
          <Skeleton className="aspect-square w-full" />
        ) : (
          <img
            src={mediaUrl(query.data?.featured?.images[0])}
            alt={query.data?.featured?.name ?? "NFT em destaque"}
            className="aspect-square w-full rounded-2xl object-cover"
          />
        )}
      </section>

      <div id="catalogo" className="mt-12 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <h2 className="mb-3 font-medium">Coleções</h2>
          <ul className="space-y-2 text-sm text-kurio-muted">
            {query.data?.meta.categories.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  className={search.category === c.name ? "text-kurio-orange" : "hover:text-kurio-cream"}
                  onClick={() => setParam({ category: search.category === c.name ? undefined : c.name })}
                >
                  {c.name} ({c.count})
                </button>
              </li>
            ))}
          </ul>
          <h2 className="mb-3 mt-8 font-medium">Faixa de preço</h2>
          <div className="space-y-2 text-sm text-kurio-muted">
            <label className="block">
              Mín. (ETH)
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={minDraft}
                onChange={(e) => setMinDraft(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-line bg-transparent px-3 text-kurio-cream"
              />
            </label>
            <label className="block">
              Máx. (ETH)
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={maxDraft}
                onChange={(e) => setMaxDraft(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-line bg-transparent px-3 text-kurio-cream"
              />
            </label>
            <p className="text-xs text-kurio-dim">
              Catálogo: {metaMin} — {metaMax} ETH
            </p>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={applyPrice}>
                Aplicar
              </Button>
              {(search.minPrice || search.maxPrice) && (
                <Button type="button" variant="ghost" onClick={clearPrice}>
                  Limpar
                </Button>
              )}
            </div>
          </div>
          <h2 className="mb-3 mt-8 font-medium">Rede</h2>
          <ul className="space-y-2 text-sm text-kurio-muted">
            {query.data?.meta.networks.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={search.network === n.id ? "text-kurio-orange" : "hover:text-kurio-cream"}
                  onClick={() => setParam({ network: search.network === n.id ? undefined : n.id })}
                >
                  {n.label} ({n.count})
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-4 text-sm">
              {[
                ["", "Todos os NFTs"],
                ["novos", "Novos lançamentos"],
                ["alta", "Em alta"],
              ].map(([id, label]) => (
                <button key={label} type="button" className={(search.tab ?? "") === id ? "text-kurio-orange" : "text-kurio-muted"} onClick={() => setParam({ tab: id || undefined })}>
                  {label}
                </button>
              ))}
            </div>
            <label className="hidden text-sm text-kurio-muted md:inline">
              Ordenar por
              <select
                className="ml-2 rounded border border-line bg-transparent p-1"
                value={search.sort ?? "recentes"}
                onChange={(e) => setParam({ sort: e.target.value })}
              >
                <option value="recentes">Listados recentemente</option>
                <option value="preco_asc">Menor preço</option>
                <option value="preco_desc">Maior preço</option>
                <option value="nome_asc">Nome</option>
              </select>
            </label>
          </div>

          {query.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : query.data?.items.length === 0 ? (
            <p>Nenhum NFT encontrado para estes filtros.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {query.data?.items.map((nft) => (
                <li key={nft.id}>
                  <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="relative block">
                    <img src={mediaUrl(nft.images[0])} alt={nft.name} className="aspect-square w-full rounded-xl object-cover" />
                    {nft.name.includes("Ivory") || nft.name.includes("Neon") ? (
                      <span className="absolute left-2 top-2 rounded bg-kurio-orange px-2 py-0.5 text-[10px] font-semibold text-black">RARO</span>
                    ) : null}
                    <p className="mt-2 text-sm">{nft.name}</p>
                    <p className="text-kurio-orange">{formatEth(nft.priceEth)}</p>
                    {nft.previousPriceEth ? <p className="text-xs text-kurio-dim line-through">{formatEth(nft.previousPriceEth)}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-end gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={page === p ? "h-8 w-8 rounded bg-kurio-orange text-black" : "h-8 w-8 text-kurio-muted"}
                onClick={() => setParam({ page: String(p) })}
              >
                {p}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
