import { Layout } from "@/components/layout";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Badge, card, btn, input, api } from "./s67m-shared";

declare global { interface Window { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<any> } } }

export default function PerksPage() {
  const [info, setInfo] = useState<any>(null);
  const [addr, setAddr] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [sig, setSig] = useState("");
  const [res, setRes] = useState<any>(null);
  const [voted, setVoted] = useState<string | null>(null);
  useEffect(() => { api("/perks/info").then(setInfo); }, []);
  const check = async (withSig: boolean) => setRes(await api("/perks/verify", { address: addr, signature: withSig ? sig : undefined }));
  const challenge = async () => { const r = await api(`/perks/challenge?address=${encodeURIComponent(addr)}`); if (r.message) setMsg(r.message); else setRes(r); };
  const signInBrowser = async () => {
    if (!window.ethereum || !msg) return;
    try { const s = await window.ethereum.request({ method: "personal_sign", params: [msg, addr] }); setSig(s); } catch { /* user cancelled */ }
  };
  const vote = async (i: number) => { const r = await api("/perks/vote", { token: res?.token, choice: i }); setVoted(r.ok ? "Vote saved, thanks!" : r.error); api("/perks/info").then(setInfo); };
  const has = (id: string) => res?.unlocked?.includes(id);
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">S67M holder perks</h1><Badge text="Sepolia test token, no cash value, not an investment" /></div>
          <p className="text-muted-foreground">Hold test S67M (earn it free in <Link href="/earn" className="underline">lessons</Link> or by mining) to unlock art perks. We only read your public balance; nothing is ever sent from your wallet.</p>
        </div>
        <div className={card}>
          <h2 className="font-semibold">Tiers</h2>
          <ul className="text-sm space-y-1">{info?.tiers?.map((t: any) => <li key={t.id}><b>{t.min.toLocaleString()} S67M</b>: {t.title} {res && (has(t.id) ? <span className="text-emerald-300">✓ unlocked</span> : <span className="text-muted-foreground">locked</span>)}</li>)}</ul>
          {info?.perkCodeEnabled && <p className="text-sm">Verified holders of 100+ S67M also get a shop perk code.</p>}
        </div>
        <div className={card}>
          <h2 className="font-semibold">1. Check your balance</h2>
          <input className={input} placeholder="Your public Sepolia address 0x..." value={addr} onChange={e => setAddr(e.target.value)} />
          <div className="flex flex-wrap gap-2"><button className={btn} disabled={!addr} onClick={() => check(false)}>Check balance</button></div>
          {res?.error && <p className="text-sm text-red-300">{res.error}</p>}
          {res?.balance !== undefined && <p className="text-sm">Balance: <b>{res.balance.toLocaleString()} S67M</b> {res.verified ? <span className="text-emerald-300">· ownership verified</span> : "· not yet verified"}</p>}
        </div>
        <div className={card}>
          <h2 className="font-semibold">2. Prove it's yours to download perks</h2>
          <p className="text-sm text-muted-foreground">Sign a free message (no transaction, no gas). Use your wallet's "sign message" feature, or the button below if you have a browser wallet. Never share your private key or seed phrase.</p>
          <button className={btn} disabled={!addr} onClick={challenge}>Get message to sign</button>
          {msg && <>
            <pre className="text-xs whitespace-pre-wrap bg-background border border-border rounded p-2">{msg}</pre>
            {window.ethereum && <button className={btn} onClick={signInBrowser}>Sign with browser wallet</button>}
            <input className={input} placeholder="Paste signature 0x..." value={sig} onChange={e => setSig(e.target.value)} />
            <button className={btn} disabled={!sig} onClick={() => check(true)}>Verify signature</button>
          </>}
        </div>
        {res?.verified && (
          <div className={card} data-testid="perks-unlocked">
            <h2 className="font-semibold">Your perks</h2>
            {!res.unlocked.length && <p className="text-sm">No tiers yet. <Link href="/earn" className="underline">Earn S67M</Link>.</p>}
            {has("wallpaper") && <p><a className={btn} href={`/api/perks/file/wallpaper?t=${res.token}`} target="_blank" rel="noreferrer">Download exclusive wallpaper</a></p>}
            {has("early") && <div><p className="text-sm mb-2">Early access: the newest evolved Mandelbulb, before it goes public.</p><img src={`/api/perks/file/early?t=${res.token}`} alt="Early-access evolved Mandelbulb" className="rounded-lg border border-border/50 w-full" /></div>}
            {has("vote") && <div className="space-y-2"><p className="text-sm">Vote on the next print:</p>{info?.voteOptions.map((o: string, i: number) => <button key={i} className={btn + " mr-2"} onClick={() => vote(i)}>{o} ({info.tally[i]})</button>)}{voted && <p className="text-sm">{voted}</p>}</div>}
            {res.perkCode && <p className="text-sm">Perk code: <code className="font-mono">{res.perkCode}</code></p>}
          </div>)}
      </div>
    </Layout>
  );
}
