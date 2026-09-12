# Lighthouse

Execute após `npm run build` com `VITE_API_MODE=msw`:

```bash
npx vite preview --port 4173
npx lhci autorun --config=./lighthouse/lighthouserc.json
```

Relatórios em `lighthouse/reports/`. Metas: Performance ≥ 90, Acessibilidade ≥ 95, Best Practices ≥ 95, SEO ≥ 90. Três medições; reporte a mediana. Não maquie a auditoria.

Ambiente ainda não executado nesta máquina (terminal sandbox indisponível no momento da implementação). Preencha LCP/CLS/TBT após a primeira corrida real.
