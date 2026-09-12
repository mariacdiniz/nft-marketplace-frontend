import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, mediaUrl } from "@/shared/api/client";
import { formatEth } from "@/shared/utils/eth";
import { Dialog } from "@/shared/ui/dialog";
import type { CatalogResponse } from "@/types";

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 200);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setDebounced("");
    }
  }, [open]);

  const results = useQuery({
    queryKey: ["search", debounced],
    queryFn: async () =>
      (await api.get<CatalogResponse>("/nfts", { params: { q: debounced, page: 1, pageSize: 8 } })).data,
    enabled: open && debounced.length > 0,
  });

  const goCatalog = (term: string) => {
    onOpenChange(false);
    void navigate({ to: "/", search: { q: term || undefined, page: "1" }, hash: "catalogo" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Buscar na Kurio" className="w-[min(92vw,520px)]">
      <form
        className="pr-8"
        onSubmit={(e) => {
          e.preventDefault();
          goCatalog(q.trim());
        }}
      >
        <label className="mb-2 block text-sm text-kurio-muted" htmlFor="kurio-search">
          Buscar NFTs, coleções e itens
        </label>
        <div className="flex h-11 items-center gap-2 rounded-md border border-line px-3">
          <Search size={16} className="shrink-0 text-kurio-muted" />
          <input
            id="kurio-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex.: Emerald, música, Kurio Apes..."
            className="w-full bg-transparent text-sm outline-none"
            autoFocus
          />
        </div>
      </form>
      <div className="mt-4 max-h-72 overflow-y-auto">
        {!debounced ? (
          <p className="text-sm text-kurio-muted">Digite um nome, coleção ou categoria para ver resultados.</p>
        ) : results.isLoading ? (
          <p className="text-sm text-kurio-muted">Buscando…</p>
        ) : results.isError ? (
          <p className="text-sm text-red-400">Não foi possível buscar. Tente novamente.</p>
        ) : results.data?.items.length === 0 ? (
          <p className="text-sm text-kurio-muted">Nenhum NFT encontrado para “{debounced}”.</p>
        ) : (
          <ul className="space-y-2">
            {results.data?.items.map((nft) => (
              <li key={nft.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-card"
                  onClick={() => {
                    onOpenChange(false);
                    void navigate({ to: "/nft/$nftId", params: { nftId: nft.id } });
                  }}
                >
                  <img src={mediaUrl(nft.images[0])} alt="" className="h-12 w-12 rounded-md object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-kurio-cream">{nft.name}</span>
                    <span className="block text-xs text-kurio-muted">
                      {nft.collection} · {nft.category}
                    </span>
                  </span>
                  <span className="text-sm text-kurio-orange">{formatEth(nft.priceEth)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {debounced && (results.data?.total ?? 0) > 8 ? (
        <button type="button" className="mt-3 text-sm text-kurio-orange" onClick={() => goCatalog(debounced)}>
          Ver todos os {results.data?.total} resultados
        </button>
      ) : null}
    </Dialog>
  );
}
