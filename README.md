# Reconcile — frontend

[Português](README.pt-BR.md)

React interface for marketplace reconciliation (Mercado Livre, Shopee, Amazon, and Mercado Pago).

**Author:** Filipe de Brito Thomé

## Languages

The UI ships in Brazilian Portuguese (`pt-BR`, default) and US English (`en-US`). Switch with **PT-BR / US-ENG** in the header. The choice is stored in the browser as `reconcile.locale`. Dates, BRL amounts, and API error messages follow the active locale.

## Development

```bat
npm install
npm run dev
```

The UI runs at `http://localhost:5173` and proxies `/api` to the backend at `http://localhost:8080`.

With the backend on `SEED_DEMO=true` and `SEED_LEDGER=true`, the pilot login is `ana.dantas@lojaexemplo.com.br` / `senha123`. The default UI range is **May 2026**, the same period as the seeded orders.

```bat
npm test
```

## Docker

With the backend already running:

```bat
docker compose up --build
```

Open `http://127.0.0.1:8081`.

Public build variables live in `.env.example`. Do not put secrets in `VITE_*`; they are compiled into the bundle.

## Copyright

Copyright (c) 2026 Filipe de Brito Thomé. All rights reserved.
