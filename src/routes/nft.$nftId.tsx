import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Heart, Search, ShoppingBag, Star } from "lucide-react";
import { api, apiError } from "@/shared/api/client";
import { formatEth } from "@/shared/utils/eth";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Qty } from "@/shared/ui/qty";
import { RelatedRail } from "@/features/catalog/related-rail";
import { useSession } from "@/features/auth/use-session";
import type { Nft, NftReview } from "@/types";

export function NftDetailPage() {
  const { nftId } = useParams({ strict: false }) as { nftId: string };
  const navigate = useNavigate();
  const session = useSession();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["nft", nftId],
    queryFn: async () => (await api.get<{ nft: Nft; related: Nft[] }>(`/nfts/${nftId}`)).data,
    enabled: Boolean(nftId),
  });
  const reviewsQuery = useQuery({
    queryKey: ["nft-reviews", nftId],
    queryFn: async () => (await api.get<{ items: NftReview[]; total: number }>(`/nfts/${nftId}/reviews`)).data,
    enabled: Boolean(nftId),
  });
  const [editionId, setEditionId] = useState<string>();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"detalhes" | "avaliacoes">("detalhes");
  const nft = query.data?.nft;
  const defaultEd = nft?.editions.find((e) => e.label === "1/50") ?? nft?.editions[1];
  const edition = nft?.editions.find((e) => e.id === (editionId ?? defaultEd?.id));

  const goLogin = () => navigate({ to: "/login", search: { redirect: `/nft/${nftId}` } });

  const add = useMutation({
    mutationFn: async () => api.post("/cart/items", { nftId, editionId: edition?.id, quantity: qty }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["cart"] });
      await navigate({ to: "/cart" });
    },
  });
  const addSilent = useMutation({
    mutationFn: async () => api.post("/cart/items", { nftId, editionId: edition?.id, quantity: qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const fav = useMutation({
    mutationFn: async () => api.post("/favorites", { nftId }),
    onError: async (err) => {
      if (apiError(err).code === "unauthenticated") await goLogin();
    },
  });

  if (query.isError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="font-display text-4xl">NFT não encontrado</h1>
        <p className="mt-2 text-kurio-muted">Este identificador não existe no catálogo Kurio.</p>
        <Button className="mt-6" asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </main>
    );
  }

  if (query.isLoading || !nft) {
    return (
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <Skeleton className="h-64" />
      </main>
    );
  }

  const about =
    "Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.";

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 md:py-8">
      <div className="mb-4 flex items-center justify-between md:hidden">
        <button type="button" aria-label="Voltar" onClick={() => history.back()}>
          <ArrowLeft />
        </button>
        <button
          type="button"
          aria-label="Favoritar"
          onClick={() => (session.data?.user ? fav.mutate() : goLogin())}
        >
          <Heart />
        </button>
      </div>
      <p className="hidden text-sm text-kurio-muted md:block">
        <Link to="/">Início</Link> / Mercado
      </p>

      <div className="mt-4 grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <div className="flex gap-3">
          <div className="hidden w-16 flex-col gap-2 md:flex">
            {nft.images.map((src, i) => (
              <img key={i} src={src} alt="" className="rounded-lg border border-line object-cover" />
            ))}
          </div>
          <div className="relative flex-1">
            <img src={nft.images[0]} alt={nft.name} className="w-full rounded-2xl object-cover" />
            <span className="absolute right-3 top-3 hidden rounded-full bg-black/40 p-2 md:inline-flex" aria-hidden>
              <Search size={16} />
            </span>
          </div>
        </div>

        <div>
          <div className="hidden md:block">
            <h1 className="text-3xl font-semibold">{nft.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-2xl text-kurio-orange">{formatEth(nft.priceEth)}</p>
              <p className="flex items-center gap-1 text-sm text-kurio-muted">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-kurio-orange text-kurio-orange" />
                ))}
                {nft.ratingCount} avaliações de colecionadores
              </p>
            </div>
            <p className="mt-4 text-sm font-medium">Sobre este NFT:</p>
            <p className="mt-1 text-sm leading-relaxed text-kurio-muted">{about}</p>
          </div>

          <div className="md:hidden">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold">{nft.name}</h1>
              <span className="rounded-full bg-card px-2 py-1 text-xs">
                ★ {nft.rating} ({nft.ratingCount})
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-kurio-muted">{nft.description}</p>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-2 text-sm">Edição:</legend>
            <div className="flex flex-wrap gap-2">
              {nft.editions.map((ed) => (
                <button
                  key={ed.id}
                  type="button"
                  disabled={!ed.available}
                  onClick={() => setEditionId(ed.id)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    (editionId ?? defaultEd?.id) === ed.id
                      ? "border-kurio-orange bg-kurio-orange/15 text-kurio-orange"
                      : "border-line text-kurio-muted"
                  } disabled:opacity-40`}
                >
                  {ed.label}
                </button>
              ))}
            </div>
            {edition && !edition.available ? <p className="mt-2 text-sm text-red-400">Edição indisponível</p> : null}
          </fieldset>

          <div className="mt-5 hidden items-center gap-4 md:flex">
            <Qty value={qty} max={edition?.remaining} onChange={setQty} />
            <Button className="px-8" onClick={() => add.mutate()} disabled={add.isPending || !edition?.available}>
              COMPRAR
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => (session.data?.user ? fav.mutate() : goLogin())}
            >
              <Heart size={16} /> Favoritar
            </Button>
          </div>
          {edition && qty >= (edition.remaining ?? 0) ? (
            <p className="mt-2 text-sm text-red-400">Limite de quantidade atingido</p>
          ) : null}

          <dl className="mt-6 space-y-1 text-sm text-kurio-muted">
            <div>
              <span className="text-kurio-cream">ID do token:</span> {nft.tokenId}
            </div>
            <div>
              <span className="text-kurio-cream">Coleção:</span> {nft.collection}
            </div>
            <div>
              <span className="text-kurio-cream">Atributos:</span> {nft.attributes.join(", ")}
            </div>
          </dl>
          <p className="mt-3 hidden text-sm md:block">
            Compartilhar este NFT:{" "}
            <span className="cursor-not-allowed text-kurio-muted">in 𝕏</span>
          </p>
        </div>
      </div>

      <div className="mt-10 hidden md:block">
        <div className="flex gap-6 border-b border-line text-sm">
          <button type="button" className={tab === "detalhes" ? "border-b-2 border-kurio-orange pb-2 text-kurio-orange" : "pb-2 text-kurio-muted"} onClick={() => setTab("detalhes")}>
            Detalhes do NFT
          </button>
          <button type="button" className={tab === "avaliacoes" ? "border-b-2 border-kurio-orange pb-2 text-kurio-orange" : "pb-2 text-kurio-muted"} onClick={() => setTab("avaliacoes")}>
            Avaliações de colecionadores ({reviewsQuery.data?.total ?? nft.ratingCount})
          </button>
        </div>
        {tab === "detalhes" ? (
          <div className="mt-4 max-w-4xl space-y-4 text-sm leading-relaxed text-kurio-muted">
            <p>
              {nft.name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos
              metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem
              fronteiras.
            </p>
            <p>
              A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente
              de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos
              trabalhos e lançamentos da comunidade.
            </p>
            <p>
              <strong className="text-kurio-cream">Rede:</strong> Cunhada na Ethereum com procedência imutável e metadados
              armazenados no IPFS.
            </p>
            <p>
              <strong className="text-kurio-cream">Contrato:</strong> Direitos autorais do criador: 5% nas vendas secundárias,
              pagos automaticamente pelos mercados compatíveis.
            </p>
            <p>
              <strong className="text-kurio-cream">Direitos autorais:</strong> 0x7A42...19E8 · Contrato inteligente ERC-721
              verificado.
            </p>
          </div>
        ) : (
          <CollectorReviews query={reviewsQuery} />
        )}
      </div>

      <RelatedRail title="Mais desta coleção" items={query.data?.related ?? []} />

      <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-line bg-canvas px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <span className="text-sm">Qtd.</span>
          <Qty value={qty} max={edition?.remaining} onChange={setQty} />
        </div>
        <p className="text-lg text-kurio-orange">{formatEth(nft.priceEth)}</p>
      </div>
      <div className="flex gap-3 pb-6 md:hidden">
        <Button className="h-12 flex-1 rounded-full" onClick={() => add.mutate()} disabled={!edition?.available}>
          Comprar NFT
        </Button>
        <button
          type="button"
          aria-label="Adicionar ao carrinho"
          className="grid h-12 w-12 place-items-center rounded-full border border-line"
          onClick={() => addSilent.mutate()}
        >
          <ShoppingBag size={18} />
        </button>
      </div>
      <div aria-live="polite" className="sr-only">
        {fav.isSuccess ? "NFT adicionado aos favoritos" : ""}
        {add.isSuccess || addSilent.isSuccess ? "NFT adicionado ao carrinho" : ""}
      </div>
    </main>
  );
}

function CollectorReviews({
  query,
}: {
  query: {
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
    data?: { items: NftReview[]; total: number };
  };
}) {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const slice = items.slice((page - 1) * pageSize, page * pageSize);

  if (query.isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mt-4">
        <p className="text-sm text-red-400">Não foi possível carregar as avaliações.</p>
        <Button className="mt-3" onClick={() => query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (total === 0) {
    return <p className="mt-4 text-sm text-kurio-muted">Nenhuma avaliação de colecionador ainda.</p>;
  }

  return (
    <div className="mt-4">
      <ul className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
        {slice.map((review) => (
          <li key={review.id} className="flex gap-3 border-b border-line pb-4">
            {review.avatarUrl ? (
              <img src={review.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-kurio-orange text-sm text-black">
                {review.authorName[0]}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-kurio-cream">{review.authorName}</p>
                <p className="text-xs text-kurio-dim">@{review.authorHandle}</p>
                <p className="text-xs text-kurio-muted">
                  {new Date(review.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="mt-1 flex items-center gap-1 text-kurio-orange" aria-label={`${review.rating} de 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < review.rating ? "fill-kurio-orange text-kurio-orange" : "text-line"}
                  />
                ))}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-kurio-muted">{review.comment}</p>
            </div>
          </li>
        ))}
      </ul>
      {pages > 1 ? (
        <div className="mt-4 flex justify-end gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={page === p ? "h-8 w-8 rounded bg-kurio-orange text-black" : "h-8 w-8 text-kurio-muted"}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
