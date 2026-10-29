// Local mock Stratum pool for tests (plain TCP). Sends an easy rx/0 job and VERIFIES every submitted
// share by recomputing RandomX with the same randomx.js the browser uses. Never touches a real pool.
import net from "node:net";
import { randomx_init_cache, randomx_create_vm } from "../../apps/crypto-ledger/artifacts/crypto-dashboard/src/lib/vendor/randomx.js";
const PORT = Number(process.env.MOCK_PORT || 3333);
const SEED = "0".repeat(63) + "1";
const vm = randomx_create_vm(randomx_init_cache(Buffer.from(SEED, "hex")));
const BLOB = "1010" + "ab".repeat(37) + "00000000" + "cd".repeat(33); // 76 bytes, nonce at 39
const TARGET = "ffffff0f"; // compact LE target 0x0fffffff: about 1 share per 16 hashes
const stats = { logins: 0, ok: 0, bad: 0, addresses: new Set() };
const meets = (h, t) => h.readUInt32LE(28) < Buffer.from(t, "hex").readUInt32LE(0);
net.createServer(sock => {
  let buf = "", jobN = 0;
  const job = () => ({ job_id: "j" + (++jobN), blob: BLOB, target: TARGET, seed_hash: SEED, algo: "rx/0" });
  sock.on("data", d => {
    buf += d; let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1);
      if (m.method === "login") { stats.logins++; stats.addresses.add(m.params.login); sock.write(JSON.stringify({ id: m.id, jsonrpc: "2.0", error: null, result: { id: "sess1", job: job(), status: "OK" } }) + "\n"); }
      else if (m.method === "submit") {
        const b = Buffer.from(BLOB, "hex"); Buffer.from(m.params.nonce, "hex").copy(b, 39);
        const h = Buffer.from(vm.calculate_hash(b));
        const good = h.toString("hex") === m.params.result && meets(h, TARGET);
        good ? stats.ok++ : stats.bad++;
        sock.write(JSON.stringify(good ? { id: m.id, jsonrpc: "2.0", error: null, result: { status: "OK" } } : { id: m.id, jsonrpc: "2.0", error: { code: -1, message: "Low difficulty share" } }) + "\n");
      } else if (m.method === "keepalived") sock.write(JSON.stringify({ id: m.id, jsonrpc: "2.0", error: null, result: { status: "KEEPALIVED" } }) + "\n");
    }
  });
  sock.on("error", () => {});
}).listen(PORT, () => console.log("mock pool on", PORT));
setInterval(() => console.log("STATS", JSON.stringify({ ...stats, addresses: [...stats.addresses] })), 2000);
