import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

const collectionFilters = ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"] as const;

export function SiteFooter() {
  const [notice, setNotice] = useState<string | null>(null);

  const soon = () => {
    setNotice("Disponível em breve");
    window.setTimeout(() => setNotice(null), 2500);
  };

  return (
    <footer className="mt-16 bg-[#1a120e] pb-24 md:pb-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-4 px-4 py-10 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["W", "Segurança da carteira", "Proteja sua carteira e colecione arte digital verificada com confiança."],
          ["C", "Criadores em destaque", "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede."],
          ["D", "Alertas de lançamentos", "Receba calendários de cunha, novidades de listas de acesso e análises do mercado."],
        ].map(([letter, title, text]) => (
          <div key={letter} className="flex h-full min-h-[220px] flex-col rounded-xl bg-[#241a15] p-5">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-kurio-orange font-display text-lg text-black">
              {letter}
            </div>
            <h2 className="font-medium text-kurio-cream">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-kurio-muted">{text}</p>
          </div>
        ))}
        <form
          className="flex h-full min-h-[220px] flex-col rounded-xl bg-[#241a15] p-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <h2 className="font-medium leading-snug text-kurio-cream">Antecipe-se ao próximo lançamento</h2>
          <label htmlFor="news-email" className="sr-only">
            Digite seu e-mail
          </label>
          <div className="mt-4 flex items-center gap-2">
            <input
              id="news-email"
              placeholder="digite seu e-mail..."
              className="h-10 min-w-0 flex-1 rounded-md border border-line bg-transparent px-3 text-sm"
            />
            <Button type="submit" className="h-10 shrink-0">
              Enviar
            </Button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-kurio-dim">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </form>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 border-t border-line px-4 py-8 text-sm text-kurio-muted md:grid-cols-4">
        <div>
          <p className="font-display tracking-[0.25em] text-kurio-cream">KURIO</p>
          <p className="mt-4 text-kurio-cream">Meu perfil</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link to="/account/profile" className="cursor-pointer hover:text-kurio-cream">
                Meu perfil
              </Link>
            </li>
            <li>
              <SoonLink onSoon={soon}>Minha coleção</SoonLink>
            </li>
            <li>
              <SoonLink onSoon={soon}>Atividade</SoonLink>
            </li>
            <li>
              <SoonLink onSoon={soon}>Estúdio do criador</SoonLink>
            </li>
            <li>
              <SoonLink onSoon={soon}>Lista de interesse</SoonLink>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-kurio-cream">Central de ajuda</p>
          <ul className="mt-2 space-y-1">
            <li>
              <SoonLink onSoon={soon}>Central de ajuda</SoonLink>
            </li>
            <li>
              <SoonLink onSoon={soon}>Como comprar NFTs</SoonLink>
            </li>
            <li>
              <SoonLink onSoon={soon}>Carteira e segurança</SoonLink>
            </li>
            <li>
              <SoonLink onSoon={soon}>Política de mercado</SoonLink>
            </li>
            <li>
              <SoonLink onSoon={soon}>Denunciar item</SoonLink>
            </li>
          </ul>
          <p className="mt-6 text-xs">Feito para colecionadores, criadores e cultura</p>
        </div>
        <div>
          <p className="text-kurio-cream">Coleções</p>
          <ul className="mt-2 space-y-1">
            {collectionFilters.map((name) => (
              <li key={name}>
                <Link to="/" search={{ category: name }} hash="catalogo" className="cursor-pointer hover:text-kurio-cream">
                  {name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <a href="mailto:contato@email.com" className="cursor-pointer hover:text-kurio-cream">
              contato@email.com
            </a>
          </p>
        </div>
        <div>
          <p className="text-kurio-cream">Redes sociais</p>
          <div className="mt-3 flex gap-3 text-kurio-cream">
            {[
              { label: "Facebook", Icon: Facebook },
              { label: "Instagram", Icon: Instagram },
              { label: "Twitter", Icon: Twitter },
              { label: "LinkedIn", Icon: Linkedin },
              { label: "YouTube", Icon: Youtube },
            ].map(({ label, Icon }) => (
              <button key={label} type="button" className="cursor-pointer hover:text-kurio-orange" aria-label={label} onClick={soon}>
                <Icon size={16} />
              </button>
            ))}
          </div>
          <p className="mt-6 text-kurio-cream">Carteiras compatíveis</p>
          <p className="mt-2 cursor-default text-[10px] tracking-wide">METAMASK · WALLETCONNECT · COINBASE</p>
          <p className="mt-6">+55 11 4002 8922</p>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-kurio-dim">© 2026 Kurio. Propriedade digital para todos.</p>
      <p aria-live="polite" className="sr-only">
        {notice ?? ""}
      </p>
      {notice ? (
        <p className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-card px-4 py-2 text-sm text-kurio-cream shadow-lg">
          {notice}
        </p>
      ) : null}
    </footer>
  );
}

function SoonLink({ children, onSoon }: { children: string; onSoon: () => void }) {
  return (
    <button type="button" className="cursor-pointer text-left hover:text-kurio-cream" onClick={onSoon}>
      {children}
    </button>
  );
}
