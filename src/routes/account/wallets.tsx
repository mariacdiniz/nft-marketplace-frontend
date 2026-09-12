import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { FieldError, Input, Label } from "@/shared/ui/input";
import type { Wallet } from "@/types";

export function WalletsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => (await api.get<{ items: Wallet[] }>("/wallets")).data,
  });
  const form = useForm({
    defaultValues: {
      displayName: "",
      nickname: "",
      network: "ethereum",
      address: "",
      type: "metamask",
      email: "",
      ensName: "",
      referralCode: "",
      secondaryAddress: "",
      role: "principal",
    },
  });
  const save = useMutation({
    mutationFn: async (values: Record<string, string>) => api.post("/wallets", values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
  });
  const err = save.error ? apiError(save.error) : undefined;
  const secondary = q.data?.items.find((w) => w.role === "secundaria");

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl">Carteira principal</h1>
          <p className="text-sm text-kurio-muted">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        </div>
        <span className="text-kurio-orange">Adicionar</span>
      </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <div>
          <Label htmlFor="displayName">Nome de exibição *</Label>
          <Input id="displayName" {...form.register("displayName", { required: "Campo obrigatório" })} />
          <FieldError id="dn-err" message={form.formState.errors.displayName?.message} />
        </div>
        <div>
          <Label htmlFor="nickname">Apelido da carteira *</Label>
          <Input id="nickname" {...form.register("nickname")} />
        </div>
        <div>
          <Label htmlFor="network">Rede *</Label>
          <select id="network" className="h-11 w-full rounded-md border border-line bg-transparent px-3" {...form.register("network")}>
            <option value="">Selecione uma rede</option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="solana">Solana</option>
          </select>
        </div>
        <div>
          <Label htmlFor="profile">Nome do perfil *</Label>
          <Input id="profile" {...form.register("ensName")} />
        </div>
        <div>
          <Label htmlFor="address">Endereço da carteira *</Label>
          <Input id="address" placeholder="Endereço da carteira" {...form.register("address")} />
        </div>
        <div>
          <Label htmlFor="secondary">ENS ou carteira secundária (opcional)</Label>
          <Input id="secondary" {...form.register("secondaryAddress")} />
        </div>
        <div>
          <Label htmlFor="type">Tipo de carteira *</Label>
          <select id="type" className="h-11 w-full rounded-md border border-line bg-transparent px-3" {...form.register("type")}>
            <option value="">Selecione uma carteira</option>
            <option value="metamask">MetaMask</option>
            <option value="walletconnect">WalletConnect</option>
            <option value="coinbase">Coinbase</option>
          </select>
        </div>
        <div>
          <Label htmlFor="referral">Código de indicação *</Label>
          <Input id="referral" {...form.register("referralCode")} />
        </div>
        <div>
          <Label htmlFor="email">E-mail *</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        {err ? (
          <p role="alert" className="md:col-span-2 text-sm text-red-400">
            {err.message}
          </p>
        ) : null}
        <div>
          <Button type="submit">Salvar carteira</Button>
        </div>
      </form>
      <div className="mt-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2>Carteira secundária</h2>
          <p className="text-sm text-kurio-muted">
            {secondary ? `${secondary.displayName} · ${secondary.address}` : "Você ainda não adicionou uma carteira secundária."}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-kurio-muted">
          <input type="radio" name="copy-primary" />
          Igual à carteira principal
          <button type="button" className="text-kurio-orange" onClick={() => form.setValue("role", "secundaria")}>
            Adicionar
          </button>
        </label>
      </div>
    </section>
  );
}
