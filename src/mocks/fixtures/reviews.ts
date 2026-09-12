import type { Nft, NftReview } from "@/types";

const authors = [
  ["Luna Mendes", "luna.eth"],
  ["Rafael Costa", "rafa.kole"],
  ["Mia Okada", "miaokada"],
  ["Theo Martins", "theo.m"],
  ["Helena Vasconcelos", "helena.v"],
  ["Igor Nunes", "igor.nfts"],
  ["Sofia Berg", "sofiab"],
  ["Caio Prado", "caio.prado"],
  ["Nina Alves", "nina.alves"],
  ["Omar Dias", "omar.dias"],
  ["Beatriz Lemos", "bia.lemos"],
  ["Yan Ferreira", "yan.f"],
  ["Clara Moura", "clara.moura"],
  ["Diego Hahn", "diego.h"],
  ["Eva Pinheiro", "eva.p"],
  ["Felix Andrade", "felix.and"],
  ["Gabi Torres", "gabi.t"],
  ["Hugo Klein", "hugo.k"],
  ["Iris Yamamoto", "iris.y"],
] as const;

const comments = [
  "Peça impecável. Os metadados batem com o que foi prometido na listagem.",
  "Comprei a edição 1/50 e o envio da arte em alta ficou disponível na hora.",
  "O retrato tem presença de verdade. Vale o ETH pedido.",
  "Atendimento do criador foi rápido e a procedência está clara.",
  "Já coleciono Kurio Apes e esta variação ficou entre as minhas favoritas.",
  "Atributos raros sem inflar o preço. Recomendo.",
  "Boa liquidez no secundário da casa. Compra tranquila.",
  "A luz e a paleta ficam ainda melhores no zoom da galeria.",
  "Edição verificada na Ethereum, exatamente como descrito.",
  "Entrega digital ok. Só achei a taxa de rede um pouco alta no dia.",
  "Ótimo para quem está começando a coleção Kurio.",
  "O criador manteve o padrão visual da série sem repetir pose.",
  "Cinco estrelas pela transparência do contrato e do royalty.",
  "Gostei do desbloqueio para colecionadores. Conteúdo extra curto, mas honesto.",
  "Chegou como 1/50. Sem surpresa no supply.",
  "A foto de capa não mente: o arquivo original é nítido.",
  "Comunidade ativa nos comentários da peça. Ajuda na hora de avaliar.",
  "Paguei um pouco acima do floor e não me arrependi.",
  "Simples, elegante e com identidade. Vira destaque na carteira.",
];

const palette = ["#E08A3A", "#C9A227", "#6b4aa8", "#2f6b3a", "#d4a017", "#8d5a3a"];

function avatarUrl(letter: string, color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='20' fill='${color}'/><text x='20' y='26' text-anchor='middle' fill='#140E0B' font-size='16' font-family='Inter,sans-serif'>${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildReviews(nftIds: string[]): NftReview[] {
  const items: NftReview[] = [];
  nftIds.forEach((nftId, nftIndex) => {
    const count = nftIndex === 0 ? 19 : nftIndex === nftIds.length - 1 ? 0 : (nftIndex % 6) + 2;
    for (let i = 0; i < count; i += 1) {
      const author = authors[i % authors.length]!;
      const stars = [5, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 2, 5, 4, 5, 5, 3, 5, 4][i % 19]!;
      items.push({
        id: `${nftId}-rev-${String(i + 1).padStart(2, "0")}`,
        nftId,
        authorName: author[0],
        authorHandle: author[1],
        avatarUrl: avatarUrl(author[0][0] ?? "K", palette[i % palette.length]!),
        rating: stars,
        createdAt: new Date(Date.UTC(2026, 4, 2 + i, 14, (i * 7) % 60)).toISOString(),
        comment: comments[i % comments.length]!,
      });
    }
  });
  return items;
}

export function applyReviewStats(nfts: Nft[], reviews: NftReview[]): void {
  for (const nft of nfts) {
    const list = reviews.filter((r) => r.nftId === nft.id);
    nft.ratingCount = list.length;
    if (list.length === 0) {
      nft.rating = 0;
      continue;
    }
    const avg = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
    nft.rating = Math.round(avg * 10) / 10;
  }
}
