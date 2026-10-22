import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useConfig } from "@/lib/wallet";
import { Wallet, Blocks, Dna, Sparkles, ExternalLink } from "lucide-react";

const B = import.meta.env.BASE_URL.replace(/\/$/, "");
type Cancer = { studies: Record<string, { name: string; sequenced: number; genes: Record<string, { freq_pct: number }> }> };
type Aq = { best: { metrics: { fitness: number } }; runs: { start_best: number; end_best: number }[] };

function Tile({ icon: Icon, title, tag, children, color }: { icon: any; title: string; tag: string; children: React.ReactNode; color: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 py-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
        <div><CardTitle>{title}</CardTitle><p className="text-xs text-muted-foreground mt-0.5">{tag}</p></div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export default function HubPage() {
  const { data: cfg } = useConfig();
  const { data: cancer } = useQuery<Cancer>({ queryKey: ["hub-cancer"], queryFn: async () => (await fetch(`${B}/hub-assets/cancer_results.json`)).json() });
  const { data: aq } = useQuery<Aq>({ queryKey: ["hub-aq"], queryFn: async () => (await fetch(`${B}/hub-assets/aqfle_best.json`)).json() });
  const top = cancer ? Object.entries(cancer.studies).map(([id, s]) => {
    const [g, v] = Object.entries(s.genes).sort((a, b) => b[1].freq_pct - a[1].freq_pct)[0];
    return { id, name: s.name.replace(/ \(TCGA.*\)/, ""), g, f: v.freq_pct };
  }) : [];
  const btn = "inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-in">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Universe Simon Hub</h1>
          <p className="text-muted-foreground mt-2">Four small learning projects in one place. Everything is read-only or play money. Nothing here can move real funds.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Tile icon={Wallet} title="Crypto Tracker" tag="Live, read-only wallet viewer (Ethereum + BNB Chain)" color="bg-cyan-500/15 text-cyan-300">
            <p className="text-sm text-muted-foreground">Balances via public RPC + Blockscout, prices from CoinGecko, value history, spam-token filter, new-address alerts, Etherscan CSV import.</p>
            <div className="flex gap-2"><Link href="/" className={btn}>Open tracker</Link><Link href="/transfers" className={btn}>Transfers</Link></div>
          </Tile>
          <Tile icon={Blocks} title="LearnChain" tag="Teaching blockchain, fake LEARN coins" color="bg-yellow-500/15 text-yellow-300">
            <p className="text-sm text-muted-foreground">SHA-256 blocks, proof-of-work, real ECDSA-signed transactions, mempool, tamper detection. Mine, send and break things on purpose.</p>
            <div className="flex gap-2"><a href={cfg?.learnchainUrl ?? "/learnchain/"} className={btn}>Open LearnChain <ExternalLink className="w-3 h-3" /></a></div>
          </Tile>
          <Tile icon={Dna} title="Cancer Driver Genes" tag="cBioPortal public TCGA data · education only" color="bg-rose-500/15 text-rose-300">
            <table className="w-full text-sm"><tbody>{top.map(t => (
              <tr key={t.id} className="border-b border-border/30"><td className="py-1.5 text-muted-foreground">{t.name}</td><td className="font-semibold">{t.g}</td><td className="text-right">{t.f.toFixed(1)}%</td></tr>))}</tbody></table>
            <a href={`${B}/hub-assets/heatmap_freq.png`} target="_blank" rel="noreferrer"><img src={`${B}/hub-assets/heatmap_freq.png`} alt="gene x study heatmap" className="rounded-lg border border-border/50 w-full" /></a>
            <div className="flex gap-2"><a className={btn} target="_blank" rel="noreferrer" href={`${B}/hub-assets/top_protein_changes.png`}>Top protein changes</a><a className={btn} target="_blank" rel="noreferrer" href={`${B}/hub-assets/cancer_report.md`}>Full report (.md)</a></div>
          </Tile>
          <Tile icon={Sparkles} title="Fractal Gallery" tag="AQFLE evolving art + 4D Mandelbulb (art / ALife, not mining)" color="bg-purple-500/15 text-purple-300">
            <div className="grid grid-cols-3 gap-2">
              {["aqfle_output.png", "mandelbulb_4d_v1.png", "mandelbulb_4d_v2.png", "mandelbulb_4d_v3.png", "mandelbulb_4d_2d.png", "aqfle_fitness.png"].map(f => (
                <a key={f} href={`${B}/hub-assets/${f}`} target="_blank" rel="noreferrer"><img src={`${B}/hub-assets/${f}`} alt={f} className="rounded-md border border-border/50 aspect-square object-cover w-full" /></a>))}
            </div>
            {aq && <p className="text-sm text-muted-foreground">Genetic algorithm: {aq.runs.length} runs, best fitness {aq.runs[0].start_best.toFixed(3)} → {aq.best.metrics.fitness.toFixed(3)}.</p>}
            <div className="flex gap-2"><Link href="/mandelbulb" className={btn}>Interactive Mandelbulb</Link></div>
          </Tile>
        </div>
      </div>
    </Layout>
  );
}
