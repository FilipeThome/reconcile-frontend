# Reconcile — frontend

Interface React da reconciliação de marketplace (Mercado Livre + Mercado Pago).

## Desenvolvimento

```bat
npm install
npm run dev
```

A UI sobe em `http://localhost:5173` e encaminha `/api` para o backend em `http://localhost:8080`.

Com o backend em `SEED_DEMO=true` e `SEED_LEDGER=true`, o login piloto é `ana.dantas@lojaexemplo.com.br` / `senha123`. O recorte padrão da UI é **maio/2026**, o mesmo período dos pedidos seed.

## Docker

Com o backend no ar:

```bat
docker compose up --build
```

Acesse `http://127.0.0.1:8081`.

Variáveis públicas de build ficam em `.env.example`. Não coloque segredos em `VITE_*` — elas entram no bundle.
