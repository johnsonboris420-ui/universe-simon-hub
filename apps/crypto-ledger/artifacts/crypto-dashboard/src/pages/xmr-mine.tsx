import { Layout } from "@/components/layout";
import { useEffect, useRef, useState } from "react";
import { XmrMiner, wasmSimdSupported, defaultThreads } from "@/lib/xmr-miner";
import { card, btn, input, api } from "./s67m-shared";
import { ShareBar } from "@/components/share";

// Opt-in, client-side only. Nothing here starts on its own, and nothing mines on any other page.
// Mining needs a WebSocket-to-Stratum relay plus a RandomX WebAssembly engine. Until both are
// configured (XMR_RELAY_URL on the server), Start stays disabled and the page only shows estimates.
// Szymon's (the artist's) own address. Pre-filled only as a clearly labelled "support the artist" choice;
// visitors can replace it with their own address to keep what they mine.
export const ARTIST_XMR = "46Cw6dXJKRTFKCTijm8nLLPkpJCdpmDwHX3dykvUxkTVeAtDL2URAMPfVnKqne4jzGfrWmrqPwWjtX9tozTYowrJTziANGV";
const XMR_RE = /^[48][1-9A-HJ-NP-Za-km-z]{94}$|^4[1-9A-HJ-NP-Za-km-z]{105}$/;

type Stats = { xmrPerHashPerDay: number | null; priceUsd: number | null; priceGbp: number | null; poolHashrate: number | null; poolMiners: number | null; relayConfigured: boolean; relayUrl: string | null; source: string; fetchedAt: string };

export default function XmrMinePage() {
  const [addr, setAddr] = useState(ARTIST_XMR);
  const maxThreads = Math.max(1, navigator.hardwareConcurrency || 2);
  const [threads, setThreads] = useState(Math.min(defaultThreads(), maxThreads));
  const [pauseHidden, setPauseHidden] = useState(true);
  const [batterySaver, setBatterySaver] = useState(true);
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const simd = wasmSimdSupported();
  const [cpu, setCpu] = useState(25);
  const [agree, setAgree] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [testHs, setTestHs] = useState(30);
  useEffect(() => { api("/xmr/stats").then(s => { if (!s.error) setStats(s); }); }, []);
  const valid = XMR_RE.test(addr.trim());
  const engineReady = !!stats?.relayUrl && simd;
  const isArtist = addr.trim() === ARTIST_XMR;
  const miner = useRef<XmrMiner | null>(null);
  const [st, setSt] = useState({ status: "Idle", hashrate: 0, accepted: 0, rejected: 0, reconnects: 0, error: "", connected: false, paused: false });
  const [since, setSince] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const running = since !== null;
  useEffect(() => { if (!running) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [running]);
  useEffect(() => () => miner.current?.stop(), []); // leaving the page always stops mining
  // Pause (not stop) while the tab is hidden, if the visitor left that option on.
  const hiddenPause = useRef(false), batteryPause = useRef(false);
  const applyPause = () => { if (!miner.current) return; (hiddenPause.current || batteryPause.current) ? miner.current.pause() : miner.current.resume(); };
  useEffect(() => { const h = () => { hiddenPause.current = pauseHidden && document.hidden; applyPause(); }; h(); document.addEventListener("visibilitychange", h); return () => document.removeEventListener("visibilitychange", h); }, [pauseHidden]);
  // Battery-aware throttle (Battery API is Chrome/Android only; elsewhere this is a no-op).
  useEffect(() => {
    const nav: any = navigator; if (!nav.getBattery) return; let b: any, alive = true;
    const upd = () => alive && setBattery({ level: b.level, charging: b.charging });
    nav.getBattery().then((x: any) => { b = x; upd(); b.addEventListener("levelchange", upd); b.addEventListener("chargingchange", upd); }).catch(() => {});
    return () => { alive = false; b?.removeEventListener("levelchange", upd); b?.removeEventListener("chargingchange", upd); };
  }, []);
  const onBattery = !!battery && !battery.charging;
  const effCpu = batterySaver && onBattery ? Math.min(cpu, battery!.level < 0.3 ? 10 : 25) : cpu;
  useEffect(() => { batteryPause.current = batterySaver && onBattery && battery!.level < 0.2; applyPause(); }, [batterySaver, onBattery, battery?.level]);
  const start = () => {
    if (!stats?.relayUrl || !valid || !agree || running) return;
    setSt(s => ({ ...s, error: "", accepted: 0 }));
    miner.current = new XmrMiner(stats.relayUrl, addr.trim(), threads, effCpu, e => setSt(s => ({ ...s, ...Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined)) } as any)));
    miner.current.start(); setSince(Date.now()); applyPause();
  };
  const stop = () => { miner.current?.stop(); miner.current = null; setSince(null); };
  useEffect(() => { miner.current?.setCpu(effCpu); }, [effCpu]);
  const up = since ? Math.floor((now - since) / 1000) : 0;
  const perDay = stats?.xmrPerHashPerDay ? stats.xmrPerHashPerDay * testHs : null;
  const Stat = ({ k, v }: { k: string; v: string }) => (<div className="rounded-lg border border-border/50 p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-lg font-mono">{v}</div></div>);
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Monero browser mining (opt-in)</h1>
          <ShareBar url="https://universe-simon-hub.onrender.com/xmr-mine" text="Opt-in Monero browser mining dashboard: your address, your CPU, honest earnings estimate" />
          <p className="text-muted-foreground">Mine Monero (XMR) on the MoneroOcean pool with your own browser, either as a tip to the artist or to <b>your own</b> address. Nothing starts unless you press Start, and it stops when you press Stop or close the tab. No other page on this site mines.</p>
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
            <input className={input} placeholder="4… or 8…" value={addr} onChange={e => setAddr(e.target.value)} disabled={running} /></label>
          <p className="text-xs" data-testid="xmr-payee">{isArtist
            ? <>Pre-filled with <b>the artist's (Szymon's) address</b>: anything you mine is a tip to him, and you get nothing back. Paste your own address to keep what you mine. <button className="underline" disabled={running} onClick={() => setAddr("")}>Use my own address</button></>
            : <>Mining pays <b>your</b> address. <button className="underline" disabled={running} onClick={() => setAddr(ARTIST_XMR)}>Tip the artist instead</button></>}</p>
          {addr && <p className={`text-xs ${valid ? "text-emerald-300" : "text-red-300"}`}>{valid ? "Address format looks valid." : "That doesn't look like a Monero address."}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <label>Threads: {threads} of {maxThreads} (default: cores − 1)<input type="range" min={1} max={maxThreads} value={threads} disabled={running} onChange={e => setThreads(+e.target.value)} className="w-full" /></label>
            <label>CPU per thread: {cpu}%{effCpu !== cpu && ` (battery saver: ${effCpu}%)`}<input type="range" min={10} max={100} step={5} value={cpu} onChange={e => setCpu(+e.target.value)} className="w-full" /></label>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <label className="flex gap-2 items-center"><input type="checkbox" checked={pauseHidden} onChange={e => setPauseHidden(e.target.checked)} /> Pause while this tab is hidden</label>
            <label className="flex gap-2 items-center"><input type="checkbox" checked={batterySaver} onChange={e => setBatterySaver(e.target.checked)} /> Battery saver: on battery, cap at 25% (10% below 30%), pause below 20%{battery ? ` — now ${Math.round(battery.level * 100)}%${battery.charging ? ", charging" : ""}` : ""}</label>
          </div>
          <p className="text-xs text-muted-foreground">Engine: RandomX.js WebAssembly SIMD {simd ? "✓ supported" : "✗ not supported in this browser (Start disabled)"}; light mode (256 MB per thread). Browsers can't use RandomX "fast mode" (needs a 2 GB dataset per page), so this is the fastest available.</p>
          <label className="text-sm flex gap-2 items-start"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /> I understand this uses my CPU, earns very little, and I can stop at any time.</label>
          <div className="flex flex-wrap gap-2">
            <button className={btn} data-testid="xmr-start" disabled={!engineReady || !valid || !agree || running} onClick={start}>Start mining</button>
            <button className={btn} data-testid="xmr-stop" disabled={!running} onClick={stop}>Stop</button>
          </div>
          {!engineReady && <p className="text-sm text-yellow-200" data-testid="xmr-unavailable">Mining is <b>not available yet</b>. Browsers can't talk to the pool directly; they need a WebSocket relay, and ours isn't online yet. Until it is, Start stays off. You can mine right now with the free XMRig app on your own computer. The estimate below still works.</p>}
          {valid && <a className="text-sm underline text-sky-300" href={`https://moneroocean.stream/#/dashboard?addr=${addr.trim()}`} target="_blank" rel="noreferrer">Open this address on the MoneroOcean dashboard</a>}
        </div>
        <div className={card}>
          <h2 className="font-semibold">Use it anywhere</h2>
          <p className="text-sm text-muted-foreground">Works in any modern browser on desktop or phone (Chrome, Firefox, Safari, Edge), in any country; there is no geo-blocking. Before mining, check your local laws and your electricity price, and keep the tab open and visible while it runs.</p>
        </div>
        <div className={card}>
          <h2 className="font-semibold">Dashboard</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat k="Status" v={engineReady ? st.status : "Unavailable"} /><Stat k="Hashrate" v={`${st.hashrate.toFixed(1)} H/s`} /><Stat k="Shares ok / rejected" v={`${st.accepted} / ${st.rejected}`} /><Stat k="Uptime" v={`${Math.floor(up / 60)}:${String(up % 60).padStart(2, "0")}`} />
          </div>
          <p className="text-xs text-muted-foreground">Relay: {st.connected ? "connected" : "not connected"}{st.reconnects ? `, reconnected ${st.reconnects}×` : ""}. Mining stops when you press Stop or leave this page{pauseHidden ? ", and pauses while the tab is hidden" : ""}. Each thread uses about 256 MB of memory.</p>
          {st.error && <p className="text-sm text-red-300">{st.error}</p>}
        </div>
        <div className={card}>
          <h2 className="font-semibold">Realistic earnings estimate</h2>
          <label className="text-sm block">If your browser did {testHs} H/s<input type="range" min={5} max={300} step={5} value={testHs} onChange={e => setTestHs(+e.target.value)} className="w-full" /></label>
          {perDay ? <p className="text-sm">≈ <b>{perDay.toExponential(2)} XMR/day</b>{stats?.priceUsd && <> ≈ <b>${(perDay * stats.priceUsd).toFixed(4)}</b> / £{(perDay * (stats.priceGbp ?? 0)).toFixed(4)} per day, ${(perDay * stats.priceUsd * 30).toFixed(3)} per month</>}, before the pool fee. Reaching the 0.003 XMR payout would take about <b>{Math.round(0.003 / perDay).toLocaleString()} days</b>.</p>
            : <p className="text-sm text-muted-foreground">Live network stats unavailable; estimate shown when they load.</p>}
          <p className="text-xs text-muted-foreground">Uses RandomX.js (BSD-3-Clause) in light mode, typically 10–60 H/s per browser.</p>
          {stats && <p className="text-xs text-muted-foreground">Estimate from current Monero difficulty and block reward ({stats.source}, {new Date(stats.fetchedAt).toLocaleString()}). MoneroOcean pool: {stats.poolHashrate ? `${(stats.poolHashrate / 1e6).toFixed(0)} MH/s` : "?"}, {stats.poolMiners ?? "?"} miners. Real results vary and are usually lower.</p>}
          <p className="text-xs"><a className="underline" href="https://moneroocean.stream" target="_blank" rel="noreferrer">moneroocean.stream</a></p>
        </div>
      </div>
    </Layout>
  );
}
