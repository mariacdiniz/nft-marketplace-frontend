import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";
import { FieldError, Input, Label } from "@/shared/ui/input";
import type { UserPublic } from "@/types";

export function ProfilePage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get<{ user: UserPublic }>("/profile")).data,
  });
  const form = useForm({
    values: {
      displayName: q.data?.user.displayName ?? "",
      username: q.data?.user.username ?? "",
      email: q.data?.user.email ?? "",
      ensName: q.data?.user.ensName ?? "",
      walletNickname: q.data?.user.walletNickname ?? "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const save = useMutation({
    mutationFn: async (values: typeof form.getValues) => {
      const v = values as unknown as Record<string, string>;
      await api.patch("/profile", {
        displayName: v.displayName,
        username: v.username,
        email: v.email,
        ensName: v.ensName,
        walletNickname: v.walletNickname,
      });
      if (v.currentPassword && v.newPassword) {
        await api.patch("/profile/password", {
          currentPassword: v.currentPassword,
          newPassword: v.newPassword,
          confirmPassword: v.confirmPassword,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
  const avatar = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("avatar", file);
      return api.post("/profile/avatar", body, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
  const err = save.error ? apiError(save.error) : undefined;

  return (
    <section>
      <h1 className="mb-6 text-xl">Perfil do colecionador</h1>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
        <div>
          <Label htmlFor="displayName">Nome de exibição *</Label>
          <Input id="displayName" {...form.register("displayName")} />
        </div>
        <div>
          <Label htmlFor="username">Nome de usuário *</Label>
          <Input id="username" {...form.register("username")} />
        </div>
        <div>
          <Label htmlFor="email">E-mail *</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        <div>
          <Label htmlFor="ens">Nome ENS *</Label>
          <div className="flex gap-2">
            <select className="h-11 rounded-md border border-kurio-orange/40 bg-transparent px-2" aria-label="Sufixo ENS" defaultValue=".eth">
              <option>.eth</option>
            </select>
            <Input id="ens" {...form.register("ensName")} />
          </div>
        </div>
        <div>
          <Label htmlFor="nick">Apelido da carteira *</Label>
          <Input id="nick" {...form.register("walletNickname")} />
        </div>
        <div>
          <p className="mb-2 text-sm">Avatar</p>
          <input
            type="file"
            accept="image/*"
            aria-label="Alterar avatar"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) avatar.mutate(file);
            }}
          />
          <Button type="button" variant="ghost">
            Remover
          </Button>
        </div>
        <div className="md:col-span-2">
          <h2 className="mb-3">Alterar senha</h2>
        </div>
        <div>
          <Label htmlFor="current">Senha atual</Label>
          <Input id="current" type="password" {...form.register("currentPassword")} />
        </div>
        <div>
          <Label htmlFor="new">Nova senha</Label>
          <Input id="new" type="password" {...form.register("newPassword")} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirmar nova senha</Label>
          <Input id="confirm" type="password" {...form.register("confirmPassword")} />
        </div>
        {err ? (
          <p role="alert" className="md:col-span-2 text-sm text-red-400">
            {err.message}
            {err.fields ? ` — ${Object.values(err.fields).join(" ")}` : ""}
          </p>
        ) : null}
        <div>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </section>
  );
}
