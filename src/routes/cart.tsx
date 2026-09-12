import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { api, apiError, mediaUrl } from "@/shared/api/client";
import { formatEth } from "@/shared/utils/eth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Qty } from "@/shared/ui/qty";
import { RelatedRail } from "@/features/catalog/related-rail";
import type { Cart, CatalogResponse, Quote } from "@/types";
import { useState } from "react";
import Decimal from "decimal.js";

export function CartPage() {
  const qc = useQueryClient();
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string>();
  const query = useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.get<{ cart: Cart; quote: Quote }>("/cart")).data,
  });
  const related = useQuery({
    queryKey: ["nfts", "related-cart"],
    queryFn: async () => (await api.get<CatalogResponse>("/nfts", { params: { page: 1 } })).data,
  });
  const patch = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => api.patch(`/cart/items/${id}`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/cart/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const apply = useMutation({
    mutationFn: async () => api.post("/quote", { couponCode: coupon }),
    onSuccess: () => {
      setCouponMsg(undefined);
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => setCouponMsg(apiError(err).message),
  });

  const quote = query.data?.quote;
  const priceAlert = quote?.lines.some((l) => l.priceChanged);
  const discount = quote?.discountEth ?? "0";

  const summary = (
    <>
      <label htmlFor="cupom" className="mt-4 block text-sm">
        Código promocional
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id="cupom"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          placeholder="Digite o código promocional..."
          aria-describedby="cupom-erro"
        />
        <Button type="button" onClick={() => apply.mutate()}>
          Aplicar
        </Button>
      </div>
      <p id="cupom-erro" className="mt-1 text-xs text-red-400">
        {couponMsg}
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatEth(quote?.subtotalEth ?? "0")}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Desconto do lançamento</dt>
          <dd>
            (-) {new Decimal(discount).isZero() ? "00.00" : formatEth(discount).replace(" ETH", "")} ETH
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Taxa de rede</dt>
          <dd className="text-right">
            {formatEth(quote?.networkFeeEth ?? "0")}
            <span className="block text-[10px] text-kurio-dim">Taxa estimada</span>
          </dd>
        </div>
        <div className="flex justify-between text-base">
          <dt>Total</dt>
          <dd className="text-kurio-orange">{formatEth(quote?.totalEth ?? "0")}</dd>
        </div>
      </dl>
      <Button className="mt-4 w-full" asChild>
        <Link to="/checkout">Conectar e finalizar</Link>
      </Button>
      <Link to="/" className="mt-3 hidden text-center text-sm text-kurio-orange md:block">
        Continuar explorando
      </Link>
    </>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 md:py-8">
      <div className="mb-4 flex items-center gap-3 md:hidden">
        <button type="button" aria-label="Voltar" onClick={() => history.back()}>
          <ArrowLeft />
        </button>
        <h1 className="flex-1 text-center text-lg font-medium">Carrinho de NFTs</h1>
        <span className="w-6" />
      </div>
      <p className="hidden text-sm text-kurio-muted md:block">Início / Mercado / Carrinho</p>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-3 hidden grid-cols-[1fr_100px_140px_100px_40px] text-xs text-kurio-muted md:grid">
            <span>NFTs</span>
            <span>Preço</span>
            <span>Edições</span>
            <span>Total</span>
            <span />
          </div>
          {query.isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ul className="space-y-3">
              {query.data?.cart.items.map((item) => (
                <li key={item.id} className="grid items-center gap-3 rounded-xl bg-card p-3 md:grid-cols-[1fr_100px_140px_100px_40px]">
                  <div className="flex items-center gap-3">
                    <img src={mediaUrl(item.image)} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
                    <div>
                      <p>{item.name}</p>
                      <p className="text-xs text-kurio-dim">ID do token: {item.tokenId}</p>
                      <p className="text-xs text-kurio-dim md:hidden">Edição: {item.editionLabel}</p>
                      <p className="text-kurio-orange md:hidden">{formatEth(item.unitPriceEth)}</p>
                    </div>
                  </div>
                  <p className="hidden md:block">{formatEth(item.unitPriceEth)}</p>
                  <div className="flex justify-end md:justify-start">
                    <Qty value={item.quantity} onChange={(n) => patch.mutate({ id: item.id, quantity: n })} />
                  </div>
                  <p className="hidden md:block">{formatEth(new Decimal(item.unitPriceEth).times(item.quantity).toFixed())}</p>
                  <button type="button" aria-label="Remover" className="hidden justify-self-end text-kurio-muted md:block" onClick={() => remove.mutate(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {priceAlert ? (
            <p role="status" aria-live="polite" className="mt-4 rounded-md border border-kurio-orange p-3 text-sm">
              Preço ou disponibilidade de um item mudou. O resumo foi atualizado.
            </p>
          ) : null}
        </section>
        <aside className="hidden rounded-xl bg-transparent md:block">
          <h2 className="font-medium">Resumo da carteira</h2>
          {query.isLoading ? <Skeleton className="mt-4 h-40" /> : summary}
        </aside>
      </div>

      <div className="md:hidden">
        {query.isLoading ? <Skeleton className="mt-4 h-40" /> : <div className="mt-6">{summary}</div>}
      </div>

      <div className="hidden md:block">
        <RelatedRail title="Colecionadores também viram" items={related.data?.items ?? []} />
      </div>
    </main>
  );
}
