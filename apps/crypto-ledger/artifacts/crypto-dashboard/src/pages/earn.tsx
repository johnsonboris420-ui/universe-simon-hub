import { Layout } from "@/components/layout";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Badge, card, btn, input, api, NO_VALUE } from "./s67m-shared";

type Lesson = { id: string; title: string; summary: string; learnUrl: string; questions: { q: string; options: string[] }[] };
type Info = { enabled: boolean; reward: number; faucetRemaining: number | null; contract: string; lessons: Lesson[] };

function LessonCard({ l, reward, enabled }: { l: Lesson; reward: number; enabled: boolean }) {
  const [ans, setAns] = useState<(number | null)[]>(l.questions.map(() => null));
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<any>(null);
  const submit = async () => { setBusy(true); setOut(await api("/earn/claim", { lessonId: l.id, answers: ans, address: addr })); setBusy(false); };
  return (
    <div className={card} data-testid={`lesson-${l.id}`}>
      <h2 className="text-lg font-semibold">{l.title}</h2>
      <p className="text-sm text-muted-foreground">{l.summary} <a className="underline" href={l.learnUrl}>Try it in LearnChain</a>.</p>
      {l.questions.map((q, i) => (
        <fieldset key={i} className={`text-sm ${out?.wrong?.includes(i) ? "text-red-300" : ""}`}>
          <legend className="font-medium mb-1">{i + 1}. {q.q}</legend>
          <div className="flex flex-wrap gap-3">{q.options.map((o, j) => (
            <label key={j} className="flex items-center gap-1"><input type="radio" name={`${l.id}-${i}`} checked={ans[i] === j} onChange={() => setAns(a => a.map((x, k) => (k === i ? j : x)))} />{o}</label>))}</div>
        </fieldset>))}
      <label className="text-sm block">Your public Sepolia address (0x…). Never your private key or seed phrase.
        <input className={input} placeholder="0x..." value={addr} onChange={e => setAddr(e.target.value)} /></label>
      <button className={btn} disabled={busy || ans.includes(null) || !addr} onClick={submit}>{busy ? "Checking…" : `Check answers & claim ${reward} S67M`}</button>
      {!enabled && <p className="text-xs text-muted-foreground">The faucet is switched off right now; you can still take the quiz.</p>}
      {out && (out.ok
        ? <p className="text-sm text-emerald-300">Sent {out.amount} S67M ({NO_VALUE}). <a className="underline" href={out.explorer} target="_blank" rel="noreferrer">View transaction</a></p>
        : <p className="text-sm text-red-300">{out.error}</p>)}
    </div>
  );
}

export default function EarnPage() {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => { api("/earn/lessons").then(setInfo); }, []);
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">Learn to earn S67M</h1><Badge /></div>
          <p className="text-muted-foreground">Finish a short lesson, pass the quiz, and get {info?.reward ?? 10} test S67M on the Sepolia test network. One claim per lesson per address. No wallet connection, no keys: just paste a public address.</p>
          <p className="text-xs text-muted-foreground">S67M is a test token with no cash value and is not an investment. <Link href="/about-s67m" className="underline">About S67M</Link> · <Link href="/perks" className="underline">What it unlocks</Link>{info?.faucetRemaining != null && <> · Faucet balance: {info.faucetRemaining.toLocaleString()} S67M</>}</p>
        </div>
        {info?.lessons.map(l => <LessonCard key={l.id} l={l} reward={info.reward} enabled={info.enabled} />)}
      </div>
    </Layout>
  );
}
