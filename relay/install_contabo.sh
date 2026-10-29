#!/usr/bin/env bash
# One-shot installer for the Universe Simon XMR relay on a fresh Contabo Ubuntu 24.04 VPS.
# The relay does NO hashing and takes NO fee; it only forwards opt-in browser miners' Stratum
# messages (WebSocket <-> MoneroOcean) and never changes the address a visitor chose.
#
# Usage (as root, on the VPS):
#   RELAY_DOMAIN=relay.example.com bash install_contabo.sh
# RELAY_DOMAIN must be a DNS A record pointing at this VPS (needed for a real TLS cert -> wss://).
# Without RELAY_DOMAIN, Caddy is set up on <ip>.sslip.io (free wildcard DNS) so wss still works.
# Then set XMR_RELAY_URL=wss://<domain> on the hub (Render) to switch Start on.
set -euo pipefail

REPO="${REPO:-https://github.com/johnsonboris420-ui/universe-simon-hub.git}"
BRANCH="${BRANCH:-main}"
POOL_HOST="${POOL_HOST:-gulf.moneroocean.stream}"
POOL_PORT="${POOL_PORT:-10128}"          # MoneroOcean plain Stratum port (use 20128 + POOL_TLS=true for TLS)
POOL_TLS="${POOL_TLS:-false}"
ORIGINS="${ALLOWED_ORIGINS:-https://universe-simon-hub.onrender.com}"
# Artist's (Szymon's) address. Used ONLY by the self-test below and shown on the status page;
# the relay never substitutes it for a visitor's address.
DEFAULT_XMR_ADDRESS="${DEFAULT_XMR_ADDRESS:-46Cw6dXJKRTFKCTijm8nLLPkpJCdpmDwHX3dykvUxkTVeAtDL2URAMPfVnKqne4jzGfrWmrqPwWjtX9tozTYowrJTziANGV}"
APP=/opt/xmr-relay
PORT=8080

[ "$(id -u)" = 0 ] || { echo "Run as root (sudo -i)"; exit 1; }
export DEBIAN_FRONTEND=noninteractive

echo "== packages"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git ufw debian-keyring debian-archive-keyring apt-transport-https

echo "== Node.js 22 (NodeSource)"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "== Caddy (automatic HTTPS for wss://)"
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

echo "== relay code"
id xmrrelay >/dev/null 2>&1 || useradd --system --home "$APP" --shell /usr/sbin/nologin xmrrelay
rm -rf /tmp/ush && git clone --depth 1 -b "$BRANCH" "$REPO" /tmp/ush
mkdir -p "$APP" && cp /tmp/ush/relay/server.mjs /tmp/ush/relay/package.json /tmp/ush/relay/package-lock.json "$APP"/
(cd "$APP" && npm ci --omit=dev)
chown -R xmrrelay:xmrrelay "$APP"

cat > /etc/xmr-relay.env <<ENV
PORT=$PORT
HOST=127.0.0.1
POOL_HOST=$POOL_HOST
POOL_PORT=$POOL_PORT
POOL_TLS=$POOL_TLS
ALLOWED_ORIGINS=$ORIGINS
DEFAULT_XMR_ADDRESS=$DEFAULT_XMR_ADDRESS
MAX_CONNECTIONS=500
MAX_PER_IP=3
TRUST_PROXY=true
ENV
chmod 644 /etc/xmr-relay.env

cat > /etc/systemd/system/xmr-relay.service <<UNIT
[Unit]
Description=Universe Simon XMR WebSocket-to-Stratum relay (no hashing, no fee)
After=network-online.target
Wants=network-online.target

[Service]
User=xmrrelay
WorkingDirectory=$APP
EnvironmentFile=/etc/xmr-relay.env
ExecStart=/usr/bin/node $APP/server.mjs
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
MemoryMax=512M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
UNIT

echo "== TLS reverse proxy"
IP="$(curl -4 -fsS https://api.ipify.org || hostname -I | awk '{print $1}')"
DOMAIN="${RELAY_DOMAIN:-$(echo "$IP" | tr . -).sslip.io}"
cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN {
  reverse_proxy 127.0.0.1:$PORT
}
CADDY

echo "== firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl daemon-reload
systemctl enable --now xmr-relay
systemctl restart caddy

echo "== self-test (pool reachability)"
sleep 3
if timeout 8 bash -c "echo > /dev/tcp/$POOL_HOST/$POOL_PORT"; then echo "pool $POOL_HOST:$POOL_PORT reachable"; else echo "WARNING: cannot reach $POOL_HOST:$POOL_PORT"; fi
curl -fsS "http://127.0.0.1:$PORT/health" && echo
echo
echo "Done. Relay URL: wss://$DOMAIN"
echo "On Render set:  XMR_RELAY_URL=wss://$DOMAIN   (this switches Start on for the opt-in page)"
echo "Logs:           journalctl -u xmr-relay -f"
