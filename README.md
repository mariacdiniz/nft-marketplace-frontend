# nft-marketplace-frontend

Marketplace **KURIO** (desafio Jungle Gaming). React 18 + Vite + TypeScript strict + TanStack Router + TanStack Query + Axios + Tailwind + shadcn/ui (primitivos) + MSW + Playwright.

Repositório **independente** do backend. Não é monorepo.

## Setup

```bash
cp .env.example .env
npm install
npx msw init public --save
npm run dev
```

App em `http://localhost:5173`.

## Modos de API

| Modo | Como |
|---|---|
| MSW (padrão da demo) | `VITE_API_MODE=msw` |
| Backend real | `VITE_API_MODE=live` e `VITE_API_URL` / `VITE_WS_URL` apontando para a API |

Query string: `?api=live` força o Axios a falar com o backend mesmo na build MSW.

## Credenciais fictícias

| E-mail | Senha |
|---|---|
| ana@kurio.dev | Colecionador@123 |
| bruno@kurio.dev | Colecionador@123 |

Senhas **não** são armazenadas em texto plano no cliente. O MSW compara um marcador `hashed:` apenas em memória.

## Cenários MSW

- `/?reset=1` restaura o cenário padrão
- `/?scenario=timeout-order` (e os demais listados em `src/mocks/scenarios`)
- Painel do avaliador: `/?debugMocks=1`

Cenários da seção 9: `default`, `empty`, `latency`, `out-of-order`, `offline`, `http-500`, `session-expired`, `unauthorized`, `register-conflict`, `coupon-invalid`, `coupon-expired`, `price-changed`, `edition-sold-out`, `timeout-order`, `payment-confirmed`, `payment-refused`.

## Scripts

- `npm run dev`
- `npm run build` / `npm run preview`
- `npm run typecheck`
- `npm run lint`
- `npm run test:e2e` (gera HTML em `playwright-report`, trace on-first-retry)
- `npm run lighthouse`

## Deploy

Vercel com rewrite SPA (`vercel.json`). `VITE_API_MODE=msw` na demo pública. WebSocket do backend real exige o serviço Node (Render/Railway/Fly), não serverless Vercel.

URL pública: _pendente_.
