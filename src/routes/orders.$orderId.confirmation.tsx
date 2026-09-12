import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";
import { api } from "@/shared/api/client";
import { formatEth } from "@/shared/utils/eth";
import { Button } from "@/shared/ui/button";
import type { Order } from "@/types";

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams({ strict: false }) as { orderId: string };
  const query = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => (await api.get<{ order: Order }>(`/orders/${orderId}`)).data,
    refetchInterval: (q) => (q.state.data?.order.status === "pendente" ? 2000 : false),
  });
  const order = query.data?.order;
  if (!order) return <main className="p-8">Carregando recibo…</main>;
  const confirmed = order.status === "confirmado";
  const title = confirmed
    ? "Seus NFTs agora estão na sua carteira"
    : order.status === "recusado"
      ? "Pagamento recusado"
      : "Pedido pendente";

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-10">
      <div className="relative w-full max-w-md rounded-2xl bg-[#1c1511] p-6 text-center shadow-2xl">
        <span className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-kurio-orange" />
        <button type="button" aria-label="Fechar" className="absolute right-4 top-4" onClick={() => navigate({ to: "/" })}>
          <X size={16} />
        </button>
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-lg border border-kurio-orange text-[10px] tracking-wide text-kurio-orange">
          THANK
          <br />
          YOU
        </div>
        <h1 className="text-base font-medium">{title}</h1>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-left text-[11px] text-kurio-muted sm:grid-cols-4">
          <div>
            <dt>ID da transação</dt>
            <dd className="text-kurio-cream">{order.txId ?? "—"}</dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd className="text-kurio-cream">{format(new Date(order.createdAt), "dd MMM, yyyy", { locale: ptBR })}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd className="text-kurio-cream">{formatEth(order.totalEth)}</dd>
          </div>
          <div>
            <dt>Carteira</dt>
            <dd className="text-kurio-cream">{order.walletLabel}</dd>
          </div>
        </dl>
        <h2 className="mt-6 text-left text-sm">Detalhes da transação</h2>
        <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2 text-left text-xs text-kurio-muted">
          <span>NFTs</span>
          <span>Edições</span>
          <span>Subtotal</span>
        </div>
        <ul className="mt-2 space-y-3 text-left">
          {order.items.map((i) => (
            <li key={`${i.nftId}-${i.editionId}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <img src={i.image} alt={i.name} className="h-10 w-10 rounded-md object-cover" />
                <div>
                  <p>{i.name}</p>
                  <p className="text-[11px] text-kurio-dim">ID do token: {i.tokenId}</p>
                </div>
              </div>
              <span className="text-kurio-muted">(x {i.quantity})</span>
              <span className="text-kurio-orange">{formatEth(i.lineTotalEth)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 text-sm">
          <p>
            Taxa de rede <span className="ml-6">{formatEth(order.networkFeeEth)}</span>
          </p>
          <p>
            Total <span className="ml-16 font-medium">{formatEth(order.totalEth)}</span>
          </p>
        </div>
        {confirmed ? (
          <p className="mt-4 text-xs leading-relaxed text-kurio-muted">
            Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede.
          </p>
        ) : null}
        <Button className="mt-5" asChild>
          <Link to="/">{confirmed ? "Ver no Etherscan" : "Voltar ao início"}</Link>
        </Button>
      </div>
    </main>
  );
}
