import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Tag,
  UserRound,
  Wallet,
} from "lucide-react";
import { api } from "@/shared/api/client";

const items = [
  { to: "/account/profile", label: "Dados do perfil", scope: true, icon: UserRound },
  { to: "/account/wallets", label: "Carteiras", scope: true, icon: Wallet },
  { to: "#", label: "Atividade", scope: false, icon: MapPin },
  { to: "#", label: "Lista de interesse", scope: false, icon: Heart },
  { to: "#", label: "Ofertas", scope: false, icon: Tag },
  { to: "#", label: "Arquivos baixados", scope: false, icon: Download },
  { to: "#", label: "Suporte", scope: false, icon: HelpCircle },
];

export function AccountLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const logout = useMutation({
    mutationFn: async () => api.post("/auth/logout"),
    onSuccess: () => {
      qc.clear();
      window.location.href = "/";
    },
  });
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <aside className="rounded-xl bg-card p-4">
        <p className="mb-4 font-medium">Meu perfil</p>
        <nav className="space-y-1 text-sm">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            const className = `flex items-center gap-2 rounded-md px-2 py-2 ${active ? "border-l-2 border-kurio-orange text-kurio-orange" : "text-kurio-muted"}`;
            return item.scope ? (
              <Link key={item.label} to={item.to} className={className}>
                <Icon size={16} /> {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                className={`${className} cursor-pointer hover:text-kurio-cream`}
                onClick={() => {
                  /* fora do escopo do desafio */
                }}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
          <button type="button" className="mt-4 flex items-center gap-2 px-2 text-kurio-muted" onClick={() => logout.mutate()}>
            <LogOut size={16} /> Sair
          </button>
        </nav>
      </aside>
      <Outlet />
    </div>
  );
}
