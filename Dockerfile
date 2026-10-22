# One container: Express API + built dashboard + LearnChain (Flask, internal) + hub assets.
# Needs a Postgres DATABASE_URL at runtime. Read-only: no keys, no signing.
FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates && rm -rf /var/lib/apt/lists/* \
 && corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# --- Node workspace (tracker API + dashboard) ---
COPY apps/crypto-ledger/ apps/crypto-ledger/
COPY tools/ tools/
COPY apps/mandelbulb/*.png apps/mandelbulb/
COPY scripts/ scripts/
RUN sh scripts/sync-hub-assets.sh
WORKDIR /app/apps/crypto-ledger
RUN CI=true pnpm install --frozen-lockfile \
 && PORT=3000 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/crypto-dashboard run build \
 && pnpm --filter @workspace/api-server run build

# --- LearnChain (play-money teaching blockchain) ---
WORKDIR /app
COPY apps/learnchain/ apps/learnchain/
RUN python3 -m venv /opt/lc && /opt/lc/bin/pip install --no-cache-dir -r apps/learnchain/requirements.txt

COPY deploy/start.sh /app/start.sh
ENV NODE_ENV=production \
    STATIC_DIR=/app/apps/crypto-ledger/artifacts/crypto-dashboard/dist/public \
    LEARNCHAIN_INTERNAL=http://127.0.0.1:5055 \
    LEARNCHAIN_URL=/learnchain/ \
    ALLOW_CSV_IMPORT=false \
    PORT=8080
EXPOSE 8080
CMD ["sh", "/app/start.sh"]
