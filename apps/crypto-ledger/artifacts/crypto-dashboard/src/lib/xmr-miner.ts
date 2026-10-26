// Opt-in browser miner controller: one WebSocket to the relay, N RandomX workers. Nothing runs until start().
export type MinerEvent = { status?: string; hashrate?: number; accepted?: number; rejected?: number; error?: string; connected?: boolean };

export class XmrMiner {
  private ws: WebSocket | null = null;
  private workers: Worker[] = [];
  private rates: number[] = [];
  private id = 1;
  accepted = 0; rejected = 0;
  constructor(private relay: string, private address: string, private threads: number, private cpu: number, private on: (e: MinerEvent) => void) {}

  start() {
    this.on({ status: "Connecting to relay…" });
    const ws = new WebSocket(this.relay);
    this.ws = ws;
    ws.onopen = () => {
      this.on({ status: "Logging in to MoneroOcean…", connected: true });
      ws.send(JSON.stringify({ id: this.id++, jsonrpc: "2.0", method: "login",
        params: { login: this.address, pass: "web", agent: "universe-simon-web/1.0", algo: ["rx/0"], "algo-perf": { "rx/0": 20 } } }));
    };
    ws.onmessage = (ev) => {
      let m: any; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.error) { this.on({ error: typeof m.error === "string" ? m.error : m.error.message || "Pool error" }); if (m.id === 1) this.stop(); return; }
      if (m.result?.job) { this.sessionId = m.result.id; this.on({ status: "Logged in, mining" }); this.dispatch(m.result.job); return; }
      if (m.method === "job") { this.dispatch(m.params); return; }
      if (m.result?.status === "OK" && m.id > 1) { this.accepted++; this.on({ accepted: this.accepted }); }
    };
    ws.onclose = () => { this.on({ status: "Disconnected", connected: false }); this.stopWorkers(); };
    ws.onerror = () => this.on({ error: "Relay connection failed (an ad-blocker or antivirus may be blocking it)" });
  }

  private dispatch(job: any) {
    if (job.algo && job.algo !== "rx/0") { this.on({ error: `Pool sent unsupported algorithm ${job.algo}` }); return; }
    if (!this.workers.length) {
      for (let i = 0; i < this.threads; i++) {
        const w = new Worker(new URL("./xmr-worker.ts", import.meta.url), { type: "module" });
        const idx = i; this.rates[idx] = 0;
        w.onmessage = (e) => {
          const m = e.data;
          if (m.type === "hashes") { this.rates[idx] = (m.n * 1000) / m.ms; this.on({ hashrate: this.rates.reduce((a, b) => a + b, 0) }); }
          if (m.type === "share" && this.ws?.readyState === 1) this.ws.send(JSON.stringify({ id: this.id++, jsonrpc: "2.0", method: "submit", params: { id: this.sessionId, job_id: m.job_id, nonce: m.nonce, result: m.result } }));
          if (m.type === "status") this.on({ status: m.text });
        };
        this.workers.push(w);
      }
    }
    const base = Math.floor(Math.random() * 0xffffffff);
    this.workers.forEach((w, i) => w.postMessage({ type: "job", job, start: base + i, stride: this.threads, cpu: this.cpu }));
  }
  private sessionId = "";
  setCpu(cpu: number) { this.cpu = cpu; this.workers.forEach(w => w.postMessage({ type: "cpu", cpu })); }
  private stopWorkers() { this.workers.forEach(w => { w.postMessage({ type: "stop" }); w.terminate(); }); this.workers = []; this.rates = []; this.on({ hashrate: 0 }); }
  stop() { this.stopWorkers(); try { this.ws?.close(); } catch {} this.ws = null; this.on({ status: "Stopped", connected: false }); }
}
