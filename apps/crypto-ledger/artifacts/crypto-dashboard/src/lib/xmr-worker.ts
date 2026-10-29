/// <reference lib="webworker" />
// RandomX hashing in a Web Worker (randomx.js, BSD-3-Clause, light/cache mode). Runs only while the page says so.
import { randomx_init_cache, randomx_create_vm } from "./vendor/randomx.js";

type Job = { job_id: string; blob: string; target: string; seed_hash: string };
let job: Job | null = null, seed = "", vm: { calculate_hash(b: Uint8Array): Uint8Array } | null = null;
let running = false, cpu = 25, start = 0, stride = 1, gen = 0;
const hex2b = (h: string) => Uint8Array.from(h.match(/../g)!.map(x => parseInt(x, 16)));
const b2hex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, "0")).join("");

function meets(hash: Uint8Array, target: string): boolean {
  const t = hex2b(target);
  if (t.length <= 4) { // 32-bit compact target, compare top 32 bits of the hash
    const tv = new DataView(new Uint8Array([...t, 0, 0, 0, 0].slice(0, 4)).buffer).getUint32(0, true);
    return new DataView(hash.buffer, hash.byteOffset).getUint32(28, true) < tv;
  }
  const tv = new DataView(new Uint8Array([...t, 0, 0, 0, 0, 0, 0, 0, 0].slice(0, 8)).buffer).getBigUint64(0, true);
  return new DataView(hash.buffer, hash.byteOffset).getBigUint64(24, true) < tv;
}

async function loop(myGen: number) {
  if (!job) return;
  if (job.seed_hash !== seed) { postMessage({ type: "status", text: "Preparing RandomX (about 1 s)…" }); vm = randomx_create_vm(randomx_init_cache(hex2b(job.seed_hash))); seed = job.seed_hash; }
  const j = job, blob = hex2b(j.blob), dv = new DataView(blob.buffer);
  let nonce = start >>> 0, hashes = 0, t0 = performance.now();
  postMessage({ type: "status", text: "Hashing" });
  while (running && myGen === gen && job === j) {
    const s = performance.now();
    dv.setUint32(39, nonce, true);
    const h = vm!.calculate_hash(blob);
    if (meets(h, j.target)) postMessage({ type: "share", job_id: j.job_id, nonce: b2hex(blob.subarray(39, 43)), result: b2hex(h) });
    nonce = (nonce + stride) >>> 0; hashes++;
    const work = performance.now() - s;
    if (cpu < 100) { // throttle: idle so the thread uses about cpu% of a core
      await new Promise(r => setTimeout(r, work * (100 - cpu) / cpu));
    } else if ((hashes & 7) === 0) await new Promise(r => setTimeout(r, 0)); // full speed: yield only to read messages
    if (performance.now() - t0 > 2000) { postMessage({ type: "hashes", n: hashes, ms: performance.now() - t0 }); hashes = 0; t0 = performance.now(); }
  }
}

onmessage = (e: MessageEvent) => {
  const m = e.data;
  if (m.type === "job") { job = m.job; start = m.start; stride = m.stride; cpu = m.cpu; running = true; loop(++gen); }
  if (m.type === "cpu") cpu = m.cpu;
  if (m.type === "stop") { running = false; gen++; postMessage({ type: "hashes", n: 0, ms: 1 }); }
};
