import { Layout } from "@/components/layout";
import { useEffect, useState } from "react";
import { card, btn, input, api } from "./s67m-shared";
import { ShareBar } from "@/components/share";

// Opt-in, client-side only. Nothing here starts on its own, and nothing mines on any other page.
// Mining needs a WebSocket-to-Stratum relay plus a RandomX WebAssembly engine. Until both are
// configured (XMR_RELAY_URL on the server), Start stays disabled and the page only shows estimates.
const XMR_RE = /^[48][1-9A-HJ-NP-Za-km-z]{94}$|^4[1-9A-HJ-NP-Za-km-z]{105}$/;

type Stats = { xmrPerHashPerDay: number | null; priceUsd: number | null; priceGbp: number | null; poolHashrate: number | null; poolMiners: number | null; relayConfigured: boolean; source: string; fetchedAt: string };

export default function XmrMinePage() {
  const [addr, setAddr] = useState("");
  const [threads, setThreads] = useState(1);
  const [cpu, setCpu] = useState(25);
  const [agree, setAgree] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [testHs, setTestHs] = useState(100);
  useEffect(() => { api("/xmr/stats").then(s => { if (!s.error) setStats(s); }); }, []);
  const valid = XMR_RE.test(addr.trim());
  const maxThreads = Math.max(1, Math.min(8, navigator.hardwareConcurrency || 2));
  const engineReady = false; // no vetted public relay / RandomX WASM engine available yet (see notice)
  const perDay = stats?.xmrPerHashPerDay ? stats.xmrPerHashPerDay * testHs : null;
  const Stat = ({ k, v }: { k: string; v: string }) => (<div className="rounded-lg border border-border/50 p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-lg font-mono">{v}</div></div>);
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Monero browser mining (opt-in)</h1>
          <ShareBar url="https://universe-simon-hub.onrender.com/xmr-mine" text="Opt-in Monero browser mining dashboard: your address, your CPU, honest earnings estimate" />
          <p className="text-muted-foreground">Mine Monero (XMR) to <b>your own</b> address on the MoneroOcean pool, using your own browser. Nothing starts unless you press Start, and it stops when you press Stop or close the tab. No other page on this site mines.</p>
        </div>
        <div className="rounded-xl border-2 border-red-500/60 bg-red-500/10 p-4 text-sm space-y-1" data-testid="xmr-disclaimer">
          <p className="font-semibold text-red-200">Read first</p>
          <ul className="list-disc ml-5 space-y-1 text-red-100/90">
            <li>This uses <b>your</b> CPU and battery, and your device will get warm.</li>
            <li>Earnings are <b>tiny</b>: a browser does roughly 50–250 H/s, which is fractions of a penny per day. Electricity usually costs <b>more</b> than you earn.</li>
            <li>MoneroOcean pays out only above its minimum (about 0.003 XMR), which can take months or years at browser speeds.</li>
            <li>Antivirus and ad-blockers may flag or block browser miners. You can stop at any time.</li>
            <li>This is not financial advice or an investment. Universe Simon takes no fee and never sees your keys.</li>
          </ul>
        </div>
        <div className={card}>
          <label className="text-sm block">Your Monero address (starts with 4 or 8; 95 or 106 characters). Never a private key or seed.
            <input className={input} placeholder="4… or 8…" value={addr} onChange={e => setAddr(e.target.value)} /></label>
          {addr && <p className={`text-xs ${valid ? "text-emerald-300" : "text-red-300"}`}>{valid ? "Address format looks valid." : "That doesn't look like a Monero address."}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <label>Threads: {threads} of {maxThreads}<input type="range" min={1} max={maxThreads} value={threads} onChange={e => setThreads(+e.target.value)} className="w-full" /></label>
            <label>CPU per thread: {cpu}%<input type="range" min={10} max={100} step={5} value={cpu} onChange={e => setCpu(+e.target.value)} className="w-full" /></label>
          </div>
          <label className="text-sm flex gap-2 items-start"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /> I understand this uses my CPU, earns very little, and I can stop at any time.</label>
          <div className="flex flex-wrap gap-2">
            <button className={btn} disabled={!engineReady || !valid || !agree}>Start mining</button>
            <button className={btn} disabled>Stop</button>
          </div>
          {!engineReady && <p className="text-sm text-yellow-200" data-testid="xmr-unavailable">Mining is <b>not available yet</b>. Browsers can't talk to the pool directly; they need a WebSocket relay, and we haven't found a trustworthy public one that allows this site. Until we run our own, Start stays off. The estimate below still works.</p>}
          {valid && <a className="text-sm underline text-sky-300" href={`https://moneroocean.stream/#/dashboard?addr=${addr.trim()}`} target="_blank" rel="noreferrer">Open this address on the MoneroOcean dashboard</a>}
        </div>
        <div className={card}>
          <h2 className="font-semibold">Use it anywhere</h2>
          <p className="text-sm text-muted-foreground">Works in any modern browser on desktop or phone (Chrome, Firefox, Safari, Edge), in any country; there is no geo-blocking. Before mining, check your local laws and your electricity price, and keep the tab open and visible while it runs.</p>
        </div>
        <div className={card}>
          <h2 className="font-semibold">Dashboard</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat k="Status" v={engineReady ? "Idle" : "Unavailable"} /><Stat k="Hashrate" v="0 H/s" /><Stat k="Accepted shares" v="0" /><Stat k="Uptime" v="0:00" />
          </div>
        </div>
        <div className={card}>
          <h2 className="font-semibold">Realistic earnings estimate</h2>
          <label className="text-sm block">If your browser did {testHs} H/s<input type="range" min={20} max={400} step={10} value={testHs} onChange={e => setTestHs(+e.target.value)} className="w-full" /></label>
          {perDay ? <p className="text-sm">≈ <b>{perDay.toExponential(2)} XMR/day</b>{stats?.priceUsd && <> ≈ <b>${(perDay * stats.priceUsd).toFixed(4)}</b> / £{(perDay * (stats.priceGbp ?? 0)).toFixed(4)} per day, ${(perDay * stats.priceUsd * 30).toFixed(3)} per month</>}, before the pool fee. Reaching the 0.003 XMR payout would take about <b>{Math.round(0.003 / perDay).toLocaleString()} days</b>.</p>
            : <p className="text-sm text-muted-foreground">Live network stats unavailable; estimate shown when they load.</p>}
          {stats && <p className="text-xs text-muted-foreground">Estimate from current Monero difficulty and block reward ({stats.source}, {new Date(stats.fetchedAt).toLocaleString()}). MoneroOcean pool: {stats.poolHashrate ? `${(stats.poolHashrate / 1e6).toFixed(0)} MH/s` : "?"}, {stats.poolMiners ?? "?"} miners. Real results vary and are usually lower.</p>}
          <p className="text-xs"><a className="underline" href="https://moneroocean.stream" target="_blank" rel="noreferrer">moneroocean.stream</a></p>
        </div>
      </div>
    </Layout>
  );
}
