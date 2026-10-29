# XMR relay (WebSocket ⇄ Stratum) for the opt-in /xmr-mine page

Browsers can't open raw TCP to a pool, so this tiny relay forwards `login` / `submit` / `keepalived`
between a visitor's browser and MoneroOcean. It does **no hashing, takes no fee, never changes the
address** the visitor chose, and must **not** run on Render (Render's AUP bans mining).

## Install on a Contabo Ubuntu 24.04 VPS
```bash
# as root on the VPS (until this PR is merged add BRANCH=xmr-miner-efficiency)
curl -fsSL https://raw.githubusercontent.com/johnsonboris420-ui/universe-simon-hub/main/relay/install_contabo.sh -o install.sh
RELAY_DOMAIN=relay.yourdomain.com bash install.sh   # or omit RELAY_DOMAIN to use <ip>.sslip.io
```
Installs Node 22, a hardened `xmr-relay` systemd service on 127.0.0.1:8080, Caddy (auto Let's Encrypt
→ `wss://`), and ufw (22/80/443 only). Pool: `gulf.moneroocean.stream:10128`.
Then set `XMR_RELAY_URL=wss://<domain>` on Render. Until that is set, Start on the page stays disabled.

Health: `curl https://<domain>/health` · Logs: `journalctl -u xmr-relay -f`

## Env
`POOL_HOST` `POOL_PORT` (10128) `POOL_TLS` (false; true with 20128) `ALLOWED_ORIGINS` `HOST` `PORT`
`MAX_CONNECTIONS` `MAX_PER_IP` `MAX_MSG_PER_MIN` `TRUST_PROXY` `DEFAULT_XMR_ADDRESS` (informational only).

## Local test (mock pool, no real pool contacted)
```bash
node relay/test/mock-pool.mjs &          # verifies every share by recomputing RandomX
PORT=8089 POOL_HOST=127.0.0.1 POOL_PORT=3333 ALLOWED_ORIGINS=http://localhost:5179 node relay/server.mjs
```
