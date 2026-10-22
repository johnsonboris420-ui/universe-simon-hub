import { useWallet, apiFor, useConfig } from "@/lib/wallet";
import { WalletPicker } from "@/components/WalletPicker";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd, formatCrypto, shortenAddress } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Holding = { symbol: string; name: string; amount: number; valueUsd: number; priceUsd: number; change24hPercent: number; chain: string; priced: boolean; contract?: string };
type Transfer = { hash: string; dateTime: string; from: string; to: string; amount: string; valueUsd: string; token: string; direction?: string; newCounterparty?: boolean; fromNametag: string; toNametag: string };
type Snap = { at: string; holdings: { s: string; c: string; a: number; v: number }[] };

export default function AssetPage() {
  const { chain = "", id = "" } = useParams();
  const wallet = useWallet();
  const key = decodeURIComponent(id).toLowerCase();
  const chainName = decodeURIComponent(chain);
  const { data: p } = useQuery<{ holdings: Holding[] }>({ queryKey: ["live-portfolio", wallet], enabled: !!wallet, queryFn: async () => (await fetch(apiFor("/portfolio", wallet))).json() });
  const { data: transfers } = useQuery<Transfer[]>({ queryKey: ["token-transfers-live", wallet], enabled: !!wallet, queryFn: async () => (await fetch(apiFor("/token-transfers", wallet))).json() });
  const { data: hist } = useQuery<Snap[]>({ queryKey: ["portfolio-history", wallet], enabled: !!wallet, queryFn: async () => (await fetch(apiFor("/portfolio/history", wallet))).json() });

  const h = p?.holdings.find(x => x.chain === chainName && ((x.contract ?? x.symbol).toLowerCase() === key));
  const explorer = chainName === "Ethereum" ? "https://etherscan.io" : "https://bscscan.com";
  const mine = (transfers ?? []).filter(t => h && chainName === "Ethereum" && t.token.endsWith(`(${h.symbol})`));
  const series = (hist ?? []).map(s => ({ t: new Date(s.at).toLocaleString(), v: s.holdings.find(x => x.s === h?.symbol && x.c === chainName)?.v ?? 0 }));

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 animate-in">
        <Link href="/" className="text-sm text-primary">← Portfolio</Link>
        {!p ? <p className="text-muted-foreground">Loading…</p> : !h ? <p className="text-muted-foreground">This asset isn't in the wallet right now.</p> : (
          <>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">{h.name} <span className="text-muted-foreground text-xl">{h.symbol}</span></h1>
              <p className="text-sm text-muted-foreground mt-1">{h.chain}{h.contract && <> · contract <a className="text-primary" target="_blank" rel="noreferrer" href={`${explorer}/token/${h.contract}`}>{shortenAddress(h.contract)}</a></>}</p>
              {!h.priced && <p className="mt-2 text-sm text-yellow-300">No market price. Unsolicited airdropped tokens are often scams: don't visit sites they advertise or approve them for trading.</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Balance</p><p className="text-xl font-bold mt-1">{formatCrypto(h.amount)} {h.symbol}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Price</p><p className="text-xl font-bold mt-1">{h.priced ? formatUsd(h.priceUsd) : "—"}</p><p className={`text-xs ${h.change24hPercent >= 0 ? "text-green-400" : "text-red-400"}`}>{h.change24hPercent.toFixed(2)}% 24h</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Value</p><p className="text-xl font-bold mt-1">{h.priced ? formatUsd(h.valueUsd) : "—"}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Value history (recorded snapshots)</CardTitle></CardHeader>
              <CardContent>{series.length >= 2 ? (
                <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={series}>
                  <XAxis dataKey="t" hide /><YAxis width={60} fontSize={11} stroke="#64748b" tickFormatter={(v: number) => `$${v.toFixed(3)}`} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v: number) => formatUsd(v)} contentStyle={{ background: "#0b1220", border: "1px solid #1e293b" }} />
                  <Line dataKey="v" stroke="#a78bfa" strokeWidth={2} dot isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
              ) : <p className="text-sm text-muted-foreground">{series.length} snapshot(s) so far; the chart needs at least 2.</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Transfers of {h.symbol}</CardTitle></CardHeader>
              <CardContent className="p-0">
                {chainName !== "Ethereum" ? <p className="p-6 text-sm text-muted-foreground">Transfer history isn't available for BNB Chain without an API key.</p> :
                 mine.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No transfers found.</p> : (
                  <table className="w-full text-sm"><tbody className="divide-y divide-border/30">
                    {mine.map(t => (
                      <tr key={t.hash + t.amount}>
                        <td className="py-3 px-6 text-muted-foreground">{t.dateTime}</td>
                        <td className="py-3 px-6">{t.direction === "out" ? `→ ${t.toNametag || shortenAddress(t.to)}` : `← ${t.fromNametag || shortenAddress(t.from)}`}
                          {t.newCounterparty && <span className="ml-2 text-[10px] px-1 rounded bg-red-500/20 text-red-300">⚠ new address</span>}</td>
                        <td className={`py-3 px-6 text-right ${t.direction === "out" ? "text-red-400" : "text-green-400"}`}>{t.direction === "out" ? "-" : "+"}{t.amount}</td>
                        <td className="py-3 px-6 text-right text-muted-foreground">{t.valueUsd || "—"}</td>
                        <td className="py-3 px-6"><a className="text-primary" target="_blank" rel="noreferrer" href={`${explorer}/tx/${t.hash}`}>tx ↗</a></td>
                      </tr>))}
                  </tbody></table>)}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
