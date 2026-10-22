import { useWallet, apiFor, useConfig } from "@/lib/wallet";
import { WalletPicker } from "@/components/WalletPicker";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd, formatCrypto } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, Activity, Zap, Coins, Wallet, Pickaxe } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function getApiUrl(path: string) {
  return `/api${path}`;
}

interface LiveHolding {
  symbol: string; name: string; amount: number; valueUsd: number; priceUsd: number;
  change24hPercent: number; chain: string; priced: boolean; contract?: string;
}
interface LivePortfolio {
  wallet: string; totalValueUsd: number; change24h: number; change24hPercent: number;
  holdings: LiveHolding[]; errors: string[]; fetchedAt: string; sources: string[];
}

export default function PortfolioPage() {
  const wallet = useWallet();
  const { isLoading: cfgLoading } = useConfig();
  if (!wallet) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-16 space-y-5">
          <h1 className="text-3xl font-display font-bold text-foreground">Watch a wallet (read-only)</h1>
          <p className="text-muted-foreground">{cfgLoading ? "Loading…" : "Paste any public Ethereum / BNB Chain address to see its live balances and history. Nothing is signed or sent, and no keys are ever needed. Your choice is kept only in this browser."}</p>
          <WalletPicker />
        </div>
      </Layout>
    );
  }
  return <PortfolioView wallet={wallet} />;
}

function PortfolioView({ wallet }: { wallet: string }) {
  const [showSpam, setShowSpam] = useState(false);
  const { data: history } = useQuery<{ at: string; totalUsd: number }[]>({
    queryKey: ["portfolio-history", wallet],
    queryFn: async () => (await fetch(apiFor("/portfolio/history", wallet))).json(),
    refetchInterval: 60000,
  });
  const { data: portfolio, isLoading, error, refetch, isFetching } = useQuery<LivePortfolio>({
    queryKey: ["live-portfolio", wallet],
    queryFn: async () => {
      const res = await fetch(apiFor("/portfolio", wallet));
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail ?? body.error ?? "Failed to load portfolio");
      return body;
    },
    refetchInterval: 60000,
    retry: 1,
  });

  if (error || (!isLoading && !portfolio)) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto mt-20 p-8 rounded-2xl border border-red-500/30 bg-red-500/5 text-center space-y-4">
          <p className="text-lg font-semibold text-red-400">Couldn't load live wallet data</p>
          <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>
          <button onClick={() => refetch()} className="px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm">Retry</button>
        </div>
      </Layout>
    );
  }
  if (isLoading || !portfolio) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }
  const priced = portfolio.holdings.filter(h => h.priced);
  const shown = showSpam ? portfolio.holdings : priced;
  const unpriced = portfolio.holdings.filter(h => !h.priced);
  const top = [...priced].filter(h => h.change24hPercent !== 0).sort((x, y) => y.change24hPercent - x.change24hPercent)[0];

  const isPositive = portfolio.change24hPercent >= 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in">
        
        <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl">
          <div className="absolute inset-0">
            <img 
              src={`${import.meta.env.BASE_URL}images/crypto-hero-bg.png`} 
              alt="Crypto Background" 
              className="w-full h-full object-cover opacity-60 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          </div>
          
          <div className="relative z-10 p-10 flex flex-col justify-end min-h-[280px]">
            <div className="flex items-center space-x-2 mb-2">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Live Wallet Value</h2>
              <span className="text-xs font-mono text-muted-foreground/70 ml-2">{portfolio.wallet}</span>
            </div>
            
            <h1 className="text-6xl font-display font-bold text-white mb-4 tracking-tight text-gradient">
              {formatUsd(portfolio.totalValueUsd)}
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1.5 rounded-lg font-medium text-sm border ${
                isPositive 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {formatUsd(Math.abs(portfolio.change24h))} ({Math.abs(portfolio.change24hPercent).toFixed(2)}%)
                <span className="ml-2 text-muted-foreground/60 text-xs">24h</span>
              </div>
              
              <div className="px-3 py-1.5 rounded-lg bg-black/20 border border-border/50 text-sm text-muted-foreground flex items-center backdrop-blur-md">
                <Activity className="w-4 h-4 mr-2 text-primary" />
                {isFetching ? "Refreshing…" : `Live · updated ${new Date(portfolio.fetchedAt).toLocaleTimeString()}`}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Assets Held</p>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{priced.length} <span className="text-sm text-muted-foreground font-normal">priced · {unpriced.length} unpriced</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Top Performer</p>
                <p className="text-xl font-display font-bold text-foreground mt-1">{top ? <>{top.symbol} <span className={`${top.change24hPercent >= 0 ? "text-green-400" : "text-red-400"} text-sm ml-1`}>{top.change24hPercent >= 0 ? "+" : ""}{top.change24hPercent.toFixed(2)}%</span></> : "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Networks (read-only)</p>
                <p className="text-xl font-display font-bold text-foreground mt-1">Ethereum + BNB Chain</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="py-5"><CardTitle>Value History</CardTitle></CardHeader>
          <CardContent>
            {history && history.length >= 2 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.map(h => ({ t: new Date(h.at).toLocaleString(), v: h.totalUsd }))}>
                    <XAxis dataKey="t" hide />
                    <YAxis tickFormatter={(v: number) => `$${v.toFixed(4)}`} width={70} stroke="#64748b" fontSize={11} domain={["auto", "auto"]} />
                    <Tooltip formatter={(v: number) => formatUsd(v)} contentStyle={{ background: "#0b1220", border: "1px solid #1e293b" }} />
                    <Area type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} fill="#22d3ee33" isAnimationActive={false} dot />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Recording real snapshots every 5 minutes ({history?.length ?? 0} so far). The chart appears once there are at least 2.</p>
            )}
          </CardContent>
        </Card>

        {portfolio.errors.length > 0 && (
          <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-300">
            Some sources failed; figures may be incomplete:
            <ul className="list-disc ml-5 mt-1">{portfolio.errors.map(e => <li key={e}>{e}</li>)}</ul>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-6">
            <CardTitle>Your Assets</CardTitle>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={showSpam} onChange={e => setShowSpam(e.target.checked)} />
                Show unpriced / airdrop tokens ({unpriced.length})
              </label>
              <span className="text-xs text-muted-foreground hidden lg:inline">Sources: {portfolio.sources.join(" · ")}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-black/10">
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Asset</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Price</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Balance</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {shown.map((holding, i) => {
                    const isMined = false;
                    return (
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={`${holding.symbol}-${holding.chain}`}
                        className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                        onClick={() => { window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/asset/${encodeURIComponent(holding.chain)}/${encodeURIComponent(holding.contract ?? holding.symbol)}`; }}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center font-display font-bold text-sm shadow-inner ${isMined ? "bg-gradient-to-br from-orange-500/30 to-yellow-500/20" : "bg-gradient-to-br from-primary/20 to-accent/20"} text-foreground`}>
                              {isMined ? <Pickaxe className="w-4 h-4 text-orange-400" /> : holding.symbol[0]}
                            </div>
                            <div className="ml-4">
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {holding.symbol}
                                {!holding.priced && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-normal" title="No market price found. Unsolicited airdropped tokens are often scams; do not interact with them.">Unpriced · possible airdrop spam</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{holding.name} • {holding.chain}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-foreground">{holding.priced ? formatUsd(holding.priceUsd) : "—"}</p>
                          <p className={`text-xs font-medium mt-1 ${holding.change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {holding.change24hPercent >= 0 ? '+' : ''}{holding.change24hPercent.toFixed(2)}%
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-foreground">{formatCrypto(holding.amount)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{holding.symbol}</p>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <p className="font-semibold text-foreground">{holding.priced ? formatUsd(holding.valueUsd) : "—"}</p>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
