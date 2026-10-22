#!/bin/sh
set -e
: "${DATABASE_URL:?DATABASE_URL must point at a Postgres database}"
cd /app/apps/crypto-ledger
echo "Applying database schema..."
pnpm --filter @workspace/db run push-force
echo "Starting LearnChain on 127.0.0.1:5055 (play money)..."
( cd /app/apps/learnchain && HOST=127.0.0.1 PORT=5055 /opt/lc/bin/python app.py ) &
echo "Starting API + dashboard on :$PORT"
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
