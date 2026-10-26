# XMR relay (WebSocket -> MoneroOcean Stratum)

Bridges the opt-in browser miner on `/xmr-mine` to MoneroOcean. Browsers can't open raw TCP, so this
forwards one WebSocket to one TLS Stratum connection.

- No hashing, no fee, no dev donation, never changes the miner's address (login must be a valid XMR address and is forwarded unchanged).
- Only `login`, `submit`, `keepalived` go upstream. Origin allowlist, max connections total/per IP, message rate limit, 8 KB frames.
- Logs connection events only (no payloads, no addresses).

## Run
```
npm install && ALLOWED_ORIGINS=https://universe-simon-hub.onrender.com PORT=8080 node server.mjs
```
Env: `POOL_HOST` (gulf.moneroocean.stream), `POOL_PORT` (20128, TLS), `MAX_CONNECTIONS` (200), `MAX_PER_IP` (3), `MAX_MSG_PER_MIN` (120).
Put it behind HTTPS (wss://), then set `XMR_RELAY_URL=wss://your-relay-host` on the hub service. Start stays disabled until that is set.

## Hosting note
Render's Acceptable Use Policy forbids using the service "for cryptocurrency mining", so this relay is
deliberately NOT in render.yaml. Host it on a VPS/provider whose terms allow mining proxies.
