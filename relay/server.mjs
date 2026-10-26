// Universe Simon XMR relay: WebSocket (browser) <-> TLS Stratum (MoneroOcean).
// It does NO hashing, takes NO fee, and NEVER changes the miner's address.
// Each browser socket gets its own pool connection; only login / submit / keepalived pass upstream,
// and a login is accepted only if its address is a valid Monero address. Everything is logged as
// connection events only (no payloads, no addresses).
import http from "node:http";
import tls from "node:tls";
import net from "node:net";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 8080);
const POOL_HOST = process.env.POOL_HOST || "gulf.moneroocean.stream";
const POOL_PORT = Number(process.env.POOL_PORT || 20128); // TLS port
const POOL_TLS = process.env.POOL_TLS !== "false"; // false only for local tests against a mock pool
const ORIGINS = (process.env.ALLOWED_ORIGINS || "https://universe-simon-hub.onrender.com").split(",").map(s => s.trim()).filter(Boolean);
const MAX_TOTAL = Number(process.env.MAX_CONNECTIONS || 200);
const MAX_PER_IP = Number(process.env.MAX_PER_IP || 3);
const MAX_MSG_PER_MIN = Number(process.env.MAX_MSG_PER_MIN || 120);
const XMR_RE = /^[48][1-9A-HJ-NP-Za-km-z]{94}$|^4[1-9A-HJ-NP-Za-km-z]{105}$/;
const ALLOWED = new Set(["login", "submit", "keepalived"]);

const perIp = new Map();
let total = 0;
const log = (...a) => console.log(new Date().toISOString(), ...a);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end(`XMR relay for Universe Simon. Connections: ${total}. No hashing, no fee, no address changes.\n`);
});
const wss = new WebSocketServer({ server, maxPayload: 8 * 1024,
  verifyClient: ({ origin, req }, cb) => {
    const ip = (req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "?").trim();
    if (!ORIGINS.includes(origin)) return cb(false, 403, "Origin not allowed");
    if (total >= MAX_TOTAL || (perIp.get(ip) || 0) >= MAX_PER_IP) return cb(false, 429, "Too many connections");
    req.clientIp = ip; cb(true);
  } });

wss.on("connection", (ws, req) => {
  const ip = req.clientIp; total++; perIp.set(ip, (perIp.get(ip) || 0) + 1);
  log("open", { total });
  let pool = null, buf = "", loggedIn = false, msgs = 0;
  const tick = setInterval(() => { msgs = 0; }, 60_000);
  const close = () => { try { ws.close(); } catch {} try { pool?.destroy(); } catch {} };
  ws.on("message", (raw) => {
    if (++msgs > MAX_MSG_PER_MIN) { log("rate-limit"); return close(); }
    let m; try { m = JSON.parse(raw.toString()); } catch { return close(); }
    if (!m || !ALLOWED.has(m.method)) return close();
    if (m.method === "login") {
      if (loggedIn || pool) return close();
      const addr = String(m.params?.login || "");
      if (!XMR_RE.test(addr)) return close();
      loggedIn = true;
      const hello = () => pool.write(JSON.stringify(m) + "\n");
      pool = POOL_TLS ? tls.connect({ host: POOL_HOST, port: POOL_PORT, servername: POOL_HOST }, hello) : net.connect(POOL_PORT, POOL_HOST, hello);
      pool.setEncoding("utf8");
      pool.on("data", (d) => {
        buf += d; let i;
        while ((i = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line && ws.readyState === 1) ws.send(line); }
        if (buf.length > 64 * 1024) close();
      });
      pool.on("error", (e) => { log("pool-error", e.code || e.message); close(); });
      pool.on("close", close);
      return;
    }
    if (!pool) return close();
    pool.write(JSON.stringify(m) + "\n"); // submit / keepalived forwarded unchanged
  });
  ws.on("close", () => { clearInterval(tick); total--; const n = (perIp.get(ip) || 1) - 1; n ? perIp.set(ip, n) : perIp.delete(ip); try { pool?.destroy(); } catch {} log("close", { total }); });
  ws.on("error", () => close());
});
server.listen(PORT, () => log(`relay on :${PORT} -> ${POOL_HOST}:${POOL_PORT}, origins ${ORIGINS.join(" ")}`));
