import { useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { api, apiError } from "@/shared/api/client";
import { formatEth } from "@/shared/utils/eth";
import { Button } from "@/shared/ui/button";
import { FieldError, Input, Label } from "@/shared/ui/input";
import type { Cart, Quote, Wallet } from "@/types";

const schema = z.object({
  displayName: z.string().min(2, "Informe o nome de exibição"),
  username: z.string().min(3, "Informe o nome de usuário"),
  network: z.enum(["ethereum", "polygon", "solana"]),
  profileName: z.string().min(2, "Informe o nome do perfil"),
  address: z.string().min(4, "Informe o endereço da carteira"),
  walletType: z.enum(["metamask", "walletconnect", "coinbase", "custodial"]),
  referralCode: z.string().min(1, "Informe o código de indicação"),
  email: z.string().email("Informe um e-mail válido"),
  ensName: z.string().min(1, "Informe o nome ENS"),
  notes: z.string().optional(),
  secondaryAddress: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [connector, setConnector] = useState<"walletconnect" | "metamask" | "coinbase">("coinbase");
  const [walletId, setWalletId] = useState<string>();
  const [staleMsg, setStaleMsg] = useState<string>();
  const [busy, setBusy] = useState(false);
  const idem = useRef(crypto.randomUUID());
  const formId = useId();
  const cartQ = useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.get<{ cart: Cart; quote: Quote }>("/cart")).data,
  });
  const wallets = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => (await api.get<{ items: Wallet[] }>("/wallets")).data,
    select: (d) => d,
  });
  const form = useForm<Form>({ resolver: zodResolver(schema) });

  const submit = () => {
    if (!walletId) {
      setStaleMsg("Selecione uma carteira cadastrada.");
      return;
    }
    setBusy(true);
    confirm.mutate(undefined, { onSettled: () => setBusy(false) });
  };

  const confirm = useMutation({
    mutationFn: async () => {
      const { data: requote } = await api.post<{ quote: Quote }>("/quote", {});
      if (requote.quote.stale) {
        throw Object.assign(new Error("stale"), { code: "stale_quote" });
      }
      return api.post(
        "/orders",
        { quoteId: requote.quote.id, walletId, network: form.getValues("network") || "ethereum" },
        { headers: { "Idempotency-Key": idem.current } },
      );
    },
    onSuccess: async (res) => {
      const order = (res.data as { order: { id: string; status: string } }).order;
      await qc.invalidateQueries({ queryKey: ["cart"] });
      if (order.status === "confirmado") {
        await navigate({ to: "/orders/$orderId/confirmation", params: { orderId: order.id } });
      } else if (order.status === "pendente") {
        await navigate({ to: "/orders/$orderId/confirmation", params: { orderId: order.id } });
      } else setStaleMsg("Pagamento recusado. Seus itens permanecem no carrinho.");
    },
    onError: (err) => {
      const e = apiError(err);
      if (e.code === "stale_quote") {
        setStaleMsg("A cotação mudou. Revise os valores e confirme novamente.");
        qc.invalidateQueries({ queryKey: ["cart"] });
        return;
      }
      if (e.code === "unauthenticated") {
        void navigate({ to: "/login", search: { redirect: "/checkout" } });
        return;
      }
      setStaleMsg(e.message);
    },
  });

  const quote = cartQ.data?.quote;
  const items = wallets.data?.items ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 md:py-8">
      <div className="mb-4 flex items-center gap-3 md:hidden">
        <button type="button" aria-label="Voltar" onClick={() => history.back()}>
          <ArrowLeft />
        </button>
        <h1 className="flex-1 text-center text-lg">Pagamento com carteira</h1>
        <span className="w-6" />
      </div>
      <p className="hidden text-sm text-kurio-muted md:block">Início / Mercado / Pagamento</p>

      <div className="mt-6 hidden gap-10 md:grid md:grid-cols-2">
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
          <h1 className="text-lg font-medium">Perfil do colecionador</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor={`${formId}-display`}>Nome de exibição *</Label>
              <Input id={`${formId}-display`} aria-describedby={`${formId}-display-err`} {...form.register("displayName")} />
              <FieldError id={`${formId}-display-err`} message={form.formState.errors.displayName?.message} />
            </div>
            <div>
              <Label htmlFor={`${formId}-user`}>Nome de usuário *</Label>
              <Input id={`${formId}-user`} {...form.register("username")} />
              <FieldError id={`${formId}-user-err`} message={form.formState.errors.username?.message} />
            </div>
            <div>
              <Label htmlFor={`${formId}-net`}>Rede *</Label>
              <select id={`${formId}-net`} className="h-11 w-full rounded-md border border-kurio-orange/40 bg-transparent px-3" {...form.register("network")}>
                <option value="">Selecione uma rede</option>
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="solana">Solana</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`${formId}-profile`}>Nome do perfil *</Label>
              <Input id={`${formId}-profile`} {...form.register("profileName")} />
            </div>
            <div>
              <Label htmlFor={`${formId}-addr`}>Endereço da carteira *</Label>
              <Input id={`${formId}-addr`} placeholder="Endereço 0x da carteira" {...form.register("address")} />
            </div>
            <div>
              <Label htmlFor={`${formId}-sec`}>ENS ou carteira secundária (opcional)</Label>
              <Input id={`${formId}-sec`} {...form.register("secondaryAddress")} />
            </div>
            <div>
              <Label htmlFor={`${formId}-type`}>Tipo de carteira *</Label>
              <select id={`${formId}-type`} className="h-11 w-full rounded-md border border-kurio-orange/40 bg-transparent px-3" {...form.register("walletType")}>
                <option value="">Selecione uma carteira</option>
                <option value="metamask">MetaMask</option>
                <option value="walletconnect">WalletConnect</option>
                <option value="coinbase">Coinbase Wallet</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`${formId}-ref`}>Código de indicação *</Label>
              <Input id={`${formId}-ref`} {...form.register("referralCode")} />
            </div>
            <div>
              <Label htmlFor={`${formId}-email`}>E-mail *</Label>
              <Input id={`${formId}-email`} type="email" {...form.register("email")} />
            </div>
            <div>
              <Label htmlFor={`${formId}-ens`}>Nome ENS *</Label>
              <div className="flex gap-2">
                <select className="h-11 rounded-md border border-kurio-orange/40 bg-transparent px-2 text-sm" defaultValue=".eth" aria-label="Sufixo ENS">
                  <option>.eth</option>
                </select>
                <Input id={`${formId}-ens`} {...form.register("ensName")} />
              </div>
            </div>
          </div>
          <button type="button" className="text-sm text-kurio-muted">
            ○ Usar outra carteira?
          </button>
          <div>
            <Label htmlFor={`${formId}-notes`}>Observação do colecionador (opcional)</Label>
            <textarea id={`${formId}-notes`} className="h-24 w-full rounded-md border border-kurio-orange/40 bg-transparent p-3" {...form.register("notes")} />
          </div>
          {staleMsg ? (
            <p role="alert" className="rounded-md border border-kurio-orange p-3 text-sm">
              {staleMsg}
            </p>
          ) : null}
        </form>

        <aside>
          <div className="flex items-center justify-between">
            <h2>Seus NFTs</h2>
            <span className="text-sm text-kurio-muted">Subtotal</span>
          </div>
          <ul className="mt-3 space-y-3">
            {cartQ.data?.cart.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <img src={i.image} alt={i.name} className="h-12 w-12 rounded-md object-cover" />
                  <div>
                    <p>{i.name}</p>
                    <p className="text-xs text-kurio-dim">ID do token: {i.tokenId}</p>
                  </div>
                </div>
                <span>
                  (x {i.quantity}) {formatEth(i.unitPriceEth)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-kurio-muted">Tem um código promocional? Aplique aqui</p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatEth(quote?.subtotalEth ?? "0")}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Desconto do lançamento</dt>
              <dd>(-) 00.00 ETH</dd>
            </div>
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd>
                {formatEth(quote?.networkFeeEth ?? "0")}
                <span className="block text-[10px] text-kurio-dim">Taxa estimada</span>
              </dd>
            </div>
            <div className="flex justify-between text-base">
              <dt>Total</dt>
              <dd className="text-kurio-orange">{formatEth(quote?.totalEth ?? "0")}</dd>
            </div>
          </dl>
          <h3 className="mt-6 text-sm">Carteira e rede</h3>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-3 rounded-md border border-line p-3 text-xs tracking-wide">
              <input type="radio" name="connector" checked={connector === "walletconnect"} onChange={() => setConnector("walletconnect")} />
              WALLETCONNECT · METAMASK · COINBASE
            </label>
            <label className="flex items-center gap-3 rounded-md border border-line p-3 text-sm">
              <input type="radio" name="connector" checked={connector === "metamask"} onChange={() => setConnector("metamask")} />
              MetaMask
            </label>
            <label className="flex items-center gap-3 rounded-md border border-kurio-orange p-3 text-sm">
              <input type="radio" name="connector" checked={connector === "coinbase"} onChange={() => setConnector("coinbase")} />
              Coinbase Wallet
            </label>
          </div>
          <fieldset className="mt-4">
            <legend className="sr-only">Carteira cadastrada</legend>
            {items.map((w) => (
              <label key={w.id} className="mb-2 flex items-center gap-2 text-sm">
                <input type="radio" name="saved-wallet" checked={walletId === w.id} onChange={() => setWalletId(w.id)} />
                {w.displayName} · {w.address}
              </label>
            ))}
          </fieldset>
          <Button className="mt-4 w-full" disabled={busy || confirm.isPending} onClick={form.handleSubmit(submit)}>
            Confirmar compra
          </Button>
        </aside>
      </div>

      <div className="md:hidden">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span>Carteira conectada</span>
          <button type="button" className="text-kurio-orange">
            Trocar carteira
          </button>
        </div>
        <ul className="space-y-3">
          {items.map((w) => (
            <li key={w.id}>
              <label className={`flex items-start justify-between rounded-2xl bg-card p-4 ${walletId === w.id ? "ring-1 ring-kurio-orange" : ""}`}>
                <span className="flex gap-3">
                  <input type="radio" name="mwallet" checked={walletId === w.id} onChange={() => setWalletId(w.id)} />
                  <span>
                    <span className="block font-medium">{w.displayName}</span>
                    <span className="block text-sm text-kurio-muted">{w.address}</span>
                    <span className="block text-xs text-kurio-dim">
                      Rede {w.role === "principal" ? "principal" : ""} {w.network}
                    </span>
                  </span>
                </span>
                <MoreVertical size={16} className="text-kurio-muted" />
              </label>
            </li>
          ))}
        </ul>
        <h2 className="mt-6 text-sm">Carteira e rede</h2>
        <div className="mt-2 space-y-2">
          {(["walletconnect", "metamask", "coinbase"] as const).map((c) => (
            <label key={c} className="flex items-center justify-between rounded-2xl bg-card p-4">
              <span>{c === "walletconnect" ? "WalletConnect" : c === "metamask" ? "MetaMask" : "Coinbase Wallet"}</span>
              <input type="radio" name="mconn" checked={connector === c} onChange={() => setConnector(c)} />
            </label>
          ))}
        </div>
        <p className="mt-6 text-right">
          Total: <span className="text-kurio-orange">{formatEth(quote?.totalEth ?? "0")}</span>
        </p>
        {staleMsg ? <p role="alert" className="mt-3 text-sm text-red-400">{staleMsg}</p> : null}
        <Button className="mt-8 h-12 w-full rounded-full" disabled={busy || confirm.isPending} onClick={submit}>
          Confirmar compra
        </Button>
      </div>
    </main>
  );
}
