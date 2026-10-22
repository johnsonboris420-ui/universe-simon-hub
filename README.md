# Universe Simon Hub

Four small, beginner-friendly learning projects in one repo, with a single web hub.

| Project | Where | What it is |
|---|---|---|
| **Crypto Tracker** ("BlockScan") | `apps/crypto-ledger` | Read-only, watch-only wallet viewer for Ethereum + BNB Chain: live balances (public RPC + Blockscout), CoinGecko prices, value history, spam-token filter, new-address alerts, Etherscan CSV import. Includes a clearly labelled *mining simulation* page (fake numbers, art only). |
| **LearnChain** | `apps/learnchain` | Teaching blockchain in Python: SHA-256 blocks, proof-of-work, ECDSA-signed transactions, mempool, tamper detection, longest-valid-chain. **Play money only.** See `apps/learnchain/LEARN.md`. |
| **Universe Simon** cancer tool | `tools/universe_simon` | Driver-gene mutation frequencies from the public cBioPortal API (TCGA), with a report, heatmap and charts. Education only, not medical advice. |
| **AQFLE** fractal engine + **4D Mandelbulb** | `tools/ara_algo`, `apps/mandelbulb` | Generative art / artificial life: a genetic algorithm evolves Game-of-Life-on-fractal parameters; Mandelbulb renders + Streamlit viewer. |

Beginner guide: **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)**.

## Safety model
- **Read-only.** The tracker never asks for, stores or uses private keys and cannot sign or send anything. It only reads public chain data.
- **No wallet hardcoded.** Set `WALLET_ADDRESS` (a public address) for a default, or leave it empty and visitors paste any address (kept in their browser only).
- **No API keys needed.** All data sources are free and keyless.
- `ALLOW_CSV_IMPORT=false` (the default in Docker) disables CSV uploads on public deployments, so strangers can't write to your DB.
- LearnChain's LEARN coins are fake and in memory only.

## Configuration (env vars)
| var | default | meaning |
|---|---|---|
| `DATABASE_URL` | required | Postgres connection string |
| `WALLET_ADDRESS` | *(empty)* | optional default wallet to watch |
| `ALLOW_CSV_IMPORT` | `true` locally, `false` in Docker | allow Etherscan CSV upload |
| `PORT` | `8080` | web port |
| `ETH_RPC_URL`, `BSC_RPC_URL` | publicnode.com | override public RPC endpoints |
| `DB_POOL_MAX` | `10` | set `1` when using PGlite locally |

## Run with Docker (production-like)
```bash
cp .env.example .env            # optionally set WALLET_ADDRESS
docker compose up --build       # Postgres + app
open http://localhost:8080/hub
```
One container serves the API (`/api/*`), the built dashboard, hub assets and LearnChain (proxied at `/learnchain/`). On start it applies the DB schema (`drizzle-kit push`).

## Deploy for free
### Render (recommended: Blueprint included)
1. Push this repo to GitHub.
2. Render dashboard: **New → Blueprint**, then pick the repo. `render.yaml` creates a free Postgres and a Docker web service.
3. Optionally set `WALLET_ADDRESS`. Deploy, then open `https://<service>.onrender.com/hub`.

Notes: Render's free web services sleep when idle (the first request takes ~30-60 s), and free Postgres instances expire after a limited period (check Render's current terms). The value-history snapshotter only runs while the service is awake.

### Fly.io
```bash
fly launch --no-deploy           # detects the Dockerfile; choose a name/region
fly postgres create              # or use any hosted Postgres (Neon, Supabase free tiers)
fly postgres attach <pg-app>     # sets DATABASE_URL
fly secrets set WALLET_ADDRESS=  # optional
fly deploy
```
Make sure `internal_port = 8080` in `fly.toml`.

## Local development
```bash
# 1. Database: any Postgres, or a throwaway PGlite server
npx -y -p @electric-sql/pglite @electric-sql/pglite-socket pglite-server --db=./pgdata --port=5433
export DATABASE_URL=postgresql://postgres@127.0.0.1:5433/postgres DB_POOL_MAX=1

# 2. Tracker API + dashboard
cd apps/crypto-ledger && pnpm install
pnpm --filter @workspace/db run push-force
(cd artifacts/api-server && PORT=8080 WALLET_ADDRESS=0xYourPublicAddress LEARNCHAIN_INTERNAL=http://127.0.0.1:5055 pnpm run dev) &
(cd artifacts/crypto-dashboard && PORT=5173 BASE_PATH=/ pnpm run dev) &      # http://localhost:5173/hub

# 3. LearnChain
cd apps/learnchain && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -q tests && .venv/bin/python app.py              # :5055

# 4. Python tools (regenerate charts, then copy them into the hub)
pip install -r tools/requirements.txt
python tools/universe_simon/universe_simon.py
python tools/ara_algo/aqfle.py
sh scripts/sync-hub-assets.sh
```

## Repo layout
```
apps/crypto-ledger/      pnpm monorepo: artifacts/api-server (Express), artifacts/crypto-dashboard (React/Vite), lib/* (db, api types)
apps/learnchain/         Python teaching blockchain + Flask UI + tests + LEARN.md
apps/mandelbulb/         4D Mandelbulb scripts (+ Streamlit viewer) and renders
tools/universe_simon/    cancer genomics CLI + generated reports
tools/ara_algo/          AQFLE genetic-algorithm art engine
scripts/                 sync-hub-assets.sh
deploy/start.sh          container entrypoint
Dockerfile, docker-compose.yml, render.yaml
```
