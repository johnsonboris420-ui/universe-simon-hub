// Opt-in browser miner controller: one WebSocket to the relay, N RandomX workers. Nothing runs until start().
export type MinerEvent = { status?: string; hashrate?: number; accepted?: number; rejected?: number; error?: string; connected?: boolean; paused?: boolean; reconnects?: number };

/** True if this browser supports the WebAssembly SIMD + bulk-memory features RandomX.js needs. */
export function wasmSimdSupported(): boolean {
  try { // v128.const + drop, the standard SIMD feature probe
    return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));
  } catch { return false; }
}
export const defaultThreads = () => Math.max(1, (navigator.hardwareConcurrency || 2) - 1);

export class XmrMiner {
  private ws: WebSocket | null = null;
  private workers: Worker[] = [];
  private rates: number[] = [];
  private id = 1;
  private sessionId = "";
  private lastJob: any = null;
  private pending = new Set<number>();
  private stopped = false;
  private paused = false;
  private retry = 0;
  private everLoggedIn = false;
  private loginFails = 0;
  private retryTimer: any = null;
  private keepTimer: any = null;
  accepted = 0; rejected = 0; reconnects = 0;
  constructor(private relay: string, private address: string, private threads: number, private cpu: number, private on: (e: MinerEvent) => void) {}

  start() { this.stopped = false; this.connect(); }

  private connect() {
    this.on({ status: this.reconnects ? `Reconnecting (try ${this.retry})…` : "Connecting to relay…" });
    const ws = new WebSocket(this.relay);
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.on({ status: "Logging in to MoneroOcean…", connected: true });
      ws.send(JSON.stringify({ id: this.id++, jsonrpc: "2.0", method: "login",
        params: { login: this.address, pass: "web", agent: "universe-simon-web/1.1", algo: ["rx/0"], "algo-perf": { "rx/0": 20 * this.threads } } }));
      clearInterval(this.keepTimer);
      this.keepTimer = setInterval(() => { if (ws.readyState === 1 && this.sessionId) ws.send(JSON.stringify({ id: this.id++, jsonrpc: "2.0", method: "keepalived", params: { id: this.sessionId } })); }, 60_000);
    };
    ws.onmessage = (ev) => {
      let m: any; try { m = JSON.parse(ev.data); } catch { return; }
      const isSubmit = typeof m.id === "number" && this.pending.delete(m.id);
      if (m.error) {
        if (isSubmit) { this.rejected++; this.on({ rejected: this.rejected }); return; }
        const msg = typeof m.error === "string" ? m.error : m.error.message || "Pool error";
        this.on({ error: msg });
        if (!this.sessionId) this.stop(); // login refused (bad address etc.): don't retry forever
        return;
      }
      if (m.result?.job) { this.sessionId = m.result.id; this.everLoggedIn = true; this.on({ status: this.paused ? "Paused" : "Mining", error: "" }); this.dispatch(m.result.job); return; }
      if (m.method === "job") { this.dispatch(m.params); return; }
      if (isSubmit && m.result?.status === "OK") { this.accepted++; this.on({ accepted: this.accepted }); }
    };
    ws.onclose = () => {
      clearInterval(this.keepTimer); this.sessionId = ""; this.pending.clear(); this.idleWorkers();
      this.on({ connected: false });
      if (this.stopped) return;
      if (!this.everLoggedIn && ++this.loginFails >= 3) { this.stop(); this.on({ error: "Could not log in through the relay (check the address, or the relay is offline)." }); return; }
      // auto-reconnect with capped exponential backoff + jitter
      const delay = Math.min(60_000, 1000 * 2 ** this.retry++) + Math.random() * 1000;
      this.reconnects++;
      this.on({ status: `Disconnected, retrying in ${Math.round(delay / 1000)} s`, reconnects: this.reconnects });
      this.retryTimer = setTimeout(() => this.connect(), delay);
    };
    ws.onerror = () => this.on({ error: "Relay connection problem (an ad-blocker or antivirus may be blocking it). Retrying automatically." });
  }

  private ensureWorkers() {
    if (this.workers.length) return;
    for (let i = 0; i < this.threads; i++) {
      const w = new Worker(new URL("./xmr-worker.ts", import.meta.url), { type: "module" });
      const idx = i; this.rates[idx] = 0;
      w.onmessage = (e) => {
        const m = e.data;
        if (m.type === "hashes") { this.rates[idx] = (m.n * 1000) / m.ms; this.on({ hashrate: this.rates.reduce((a, b) => a + b, 0) }); }
        if (m.type === "share" && this.ws?.readyState === 1 && this.sessionId) {
          const id = this.id++; this.pending.add(id);
          this.ws.send(JSON.stringify({ id, jsonrpc: "2.0", method: "submit", params: { id: this.sessionId, job_id: m.job_id, nonce: m.nonce, result: m.result } }));
        }
        if (m.type === "status") this.on({ status: m.text });
      };
      this.workers.push(w);
    }
  }

  private dispatch(job: any) {
    if (job.algo && job.algo !== "rx/0") { this.on({ error: `Pool sent unsupported algorithm ${job.algo}` }); return; }
    this.lastJob = job;
    if (this.paused) return;
    this.ensureWorkers();
    const base = Math.floor(Math.random() * 0xffffffff);
    this.workers.forEach((w, i) => w.postMessage({ type: "job", job, start: base + i, stride: this.threads, cpu: this.cpu }));
  }

  /** Pause hashing but keep the pool session (used for hidden tab / low battery). */
  pause() { if (this.paused) return; this.paused = true; this.idleWorkers(); this.on({ paused: true, status: "Paused" }); }
  resume() { if (!this.paused) return; this.paused = false; this.on({ paused: false, status: "Mining" }); if (this.lastJob && this.sessionId) this.dispatch(this.lastJob); }
  setCpu(cpu: number) { this.cpu = cpu; this.workers.forEach(w => w.postMessage({ type: "cpu", cpu })); }
  private idleWorkers() { this.workers.forEach(w => w.postMessage({ type: "stop" })); this.rates = this.rates.map(() => 0); this.on({ hashrate: 0 }); }
  private stopWorkers() { this.workers.forEach(w => { w.postMessage({ type: "stop" }); w.terminate(); }); this.workers = []; this.rates = []; this.on({ hashrate: 0 }); }
  stop() {
    this.stopped = true; clearTimeout(this.retryTimer); clearInterval(this.keepTimer);
    this.stopWorkers(); try { this.ws?.close(); } catch {} this.ws = null;
    this.on({ status: "Stopped", connected: false, paused: false });
  }
}
