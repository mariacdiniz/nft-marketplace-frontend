import { Link } from "@tanstack/react-router";
import { formatEth } from "@/shared/utils/eth";
import type { Nft } from "@/types";

export function RelatedRail({ title, items }: { title: string; items: Nft[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-kurio-orange">{title}</h2>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {items.slice(0, 5).map((n) => (
          <li key={n.id}>
            <Link to="/nft/$nftId" params={{ nftId: n.id }} className="block">
              <img src={n.images[0]} alt={n.name} className="aspect-square w-full rounded-xl object-cover" />
              <p className="mt-2 text-sm">{n.name}</p>
              <p className="text-kurio-orange">{formatEth(n.priceEth)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
