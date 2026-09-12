# Arquitetura — KURIO NFT Marketplace (frontend)

## Front e back separados + MSW obrigatório

O backend (`nft-marketplace-backend`) é um servidor Express + Socket.IO real, com fixtures em memória e os mesmos contratos REST/eventos. O frontend consome esse backend com Axios quando `VITE_API_MODE=live`.

A camada de mocks **MSW** (`msw`, `msw/node`, `@mswjs/socket.io-binding`) é obrigatória e efetiva:

- desenvolvimento sem o backend no ar;
- build de demonstração com reset de cenários;
- todos os testes Playwright passam pelos handlers (o app sobe em modo `msw`);
- latência, timeout, 4xx/5xx e sockets mockados.

Axios, hooks e componentes **não** contêm mocks hardcoded. Simulação vive em `src/mocks/handlers` e `src/mocks/socket-handlers.ts`.

## Binding Socket.IO

Usamos `@mswjs/socket.io-binding` (`toSocketIo`) sobre `ws.link` do MSW. O cliente continua sendo `socket.io-client`. Limitações: o binding não cobre 100% da API Socket.IO; usamos transporte `websocket`. Eventos de debug `debug:nft.updated` / `debug:order.updated` são emitidos pelo cliente de teste e reemitidos pelo binding — nunca por `setState` direto na UI.

## Contratos REST

Espelham o `openapi.yaml` do backend: `/auth/*`, `/session`, `/nfts`, `/nfts/{id}/reviews`, `/favorites`, `/cart`, `/quote`, `/orders` (header `Idempotency-Key`), `/profile`, `/wallets`. ETH sempre como **string decimal** (`decimal.js`). Quantidades inteiras. `ratingCount` do NFT é derivado da quantidade de avaliações nas fixtures.

Erros: 422 validação, 401 sessão, 403 permissão, 404, 409 conflito, 500/503.

## Sessão

Cookie `kurio_session` httpOnly no backend live. No MSW, a sessão fica no estado persistido em `localStorage` da camada de mock (não é token de senha). `GET /session` reidrata o usuário. Rotas `/checkout`, `/account/*`, `/orders/*/confirmation` usam `beforeLoad` do TanStack Router.

Logout chama `queryClient.clear()` e desconecta o socket (`useRealtime` depende do `userId`).

## Carrinho

Persistido via API (MSW localStorage ou backend). Merge do carrinho visitante no login/cadastro. Cotação (`POST /quote`) é a fonte de verdade de subtotal, desconto, taxa e total.

## TanStack Query

Chaves derivadas dos search params do catálogo. Retry limitado. Invalidação em mutações e em `nft.updated` / `connect`. Respostas fora de ordem: o Query gerencia por queryKey + cancelamento padrão.

## Tempo real

Eventos carregam `resourceId`, recurso e `version`/`timestamp`. O cliente ignora versões ≤ última vista. Após `connect`, refetch REST. Pedidos confirmados/recusados são terminais.

## Decisões de UX / Figma

- Marca **KURIO** (não GreenMint — GreenMint é só o nome da página no Figma).
- Copy extraída dos frames desktop/mobile do protótipo e do PNG `Desktop/Início.png`.
- Google/Facebook usam `POST /auth/social` (login **simulado**, sem OAuth real). Newsletter, Mercado/Criadores/Aprenda, Central de ajuda, Atividade, Ofertas, Downloads: visíveis, sem fluxo editorial.
- Retratos dos NFTs: SVG determinísticos no MSW (os PNG individuais do Figma não estavam na pasta exportada além de `Início.png`). Documentado como substituição de asset.
- Perfil, Carteiras e Confirmação no mobile reutilizam o design system das outras telas mobile.
- Fonte display: Bebas Neue; corpo: Inter. Cores aproximadas dos frames: canvas `#140E0B`, laranja `#E08A3A`, creme `#F4EBE3`.
- Login/cadastro no desktop são **modais sobre o catálogo**, como no Figma; no mobile são telas cheias (frames mobile).
- Perfil, Carteiras e Confirmação no mobile reutilizam o design system das outras telas mobile (frames mobile específicos existem para Início, Detalhe, Carrinho, Pagamento, Login e Cadastro).

## Bibliotecas extras

- `zod` + `react-hook-form`: validação e erros de API.
- `decimal.js`: ETH.
- `date-fns`: datas do recibo (`toLocaleDateString` no recibo; date-fns disponível).
- `lucide-react`: ícones (substitutos dos ícones do Figma).
- Sem Zustand: drawer/modal não exigiu store global.

## Limitações

- Deploy e auditoria Lighthouse ainda sem URL/relatórios versionados (ambiente local sem terminal executável no momento da geração).
- Worker MSW versionado em `public/mockServiceWorker.js` (v2.7.0). Rode `npx msw init public --save` se o checksum divergir.
- Visual Playwright precisa de `npx playwright test --update-snapshots` na primeira máquina.
