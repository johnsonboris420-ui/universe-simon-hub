import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useConfig } from "@/lib/wallet";
import { Wallet, Blocks, Dna, Sparkles, ExternalLink, ShoppingBag } from "lucide-react";

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
          <p className="text-muted-foreground mt-2">The home of Universe Simon: shop, art and learning projects in one place. Everything is read-only or play money. Nothing here can move real funds.</p>
        </div>
        <Card id="shop" className="border-purple-400/40 bg-purple-500/5">
          <CardHeader className="flex flex-row items-center gap-3 py-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20 text-purple-300"><ShoppingBag className="w-5 h-5" /></div>
            <div><CardTitle>Universe Simon Shop</CardTitle><p className="text-xs text-muted-foreground mt-0.5">Original fractal art by Szymon: prints, posters and stickers</p></div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <a href={`${B}/fractal-house/`} className={btn + " !bg-purple-400 !text-black font-semibold"}>Fractal House: shop &amp; commissions</a>
            <a href={`${B}/gallery/mandelbulb/`} className={btn}>Buy digital originals (ETH)</a>
            <a href="https://www.redbubble.com/people/SzymonFractals/shop" target="_blank" rel="noreferrer" className={btn}>Redbubble shop <ExternalLink className="w-3 h-3" /></a>
            <a href="https://www.redbubble.com/people/SzymonFractals/shop?collections=4599821" target="_blank" rel="noreferrer" className={btn}>Fractal Posters <ExternalLink className="w-3 h-3" /></a>
            <a href="https://www.redbubble.com/people/SzymonFractals/shop?collections=4599822" target="_blank" rel="noreferrer" className={btn}>Fractal Stickers <ExternalLink className="w-3 h-3" /></a>
            <a href={`${B}/gallery/`} className={btn}>Gallery</a>
            <a href={`${B}/gallery/#pay-eth`} className={btn}>Pay in ETH</a>
            <Link href="/earn" className={btn}>Learn to earn S67M (test token, no cash value)</Link>
          </CardContent>
        </Card>
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
          <Tile icon={Sparkles} title="Frameless OS" tag="Desktop UI demo (front end only, no server terminal)" color="bg-cyan-500/15 text-cyan-300">
            <p className="text-sm text-muted-foreground">Your Quantum-Evolve-System desktop shell: boot screen, windows, taskbar, investor slideshow. Server features are switched off on the public site for safety.</p>
            <div className="flex gap-2"><a href={`${B}/frameless/`} className={btn}>Open Frameless OS</a><a href={`${B}/gallery/`} className={btn}>Fractal poster gallery</a><a href="https://www.redbubble.com/people/SzymonFractals/shop" target="_blank" rel="noreferrer" className={btn}>Buy prints</a></div>
          </Tile>
          <Tile icon={Sparkles} title="Fractal Gallery" tag="AQFLE evolving art + 4D Mandelbulb (art / ALife, not mining)" color="bg-purple-500/15 text-purple-300">
            <div className="grid grid-cols-3 gap-2">
              {["aqfle_output.png", "mandelbulb_4d_v1.png", "mandelbulb_4d_v2.png", "mandelbulb_4d_v3.png", "mandelbulb_4d_2d.png", "aqfle_fitness.png"].map(f => (
                <a key={f} href={`${B}/hub-assets/${f}`} target="_blank" rel="noreferrer"><img src={`${B}/hub-assets/${f}`} alt={f} className="rounded-md border border-border/50 aspect-square object-cover w-full" /></a>))}
            </div>
            {aq && <p className="text-sm text-muted-foreground">Genetic algorithm: {aq.runs.length} runs, best fitness {aq.runs[0].start_best.toFixed(3)} → {aq.best.metrics.fitness.toFixed(3)}.</p>}
            <div className="flex gap-2"><Link href="/mandelbulb" className={btn}>Interactive Mandelbulb</Link></div>
          </Tile>
          <Tile icon={Sparkles} title="HighLife × AQFLE experiment" tag="Ara · cellular automaton + genetic algorithm (22 Oct 2026)" color="bg-amber-500/15 text-amber-300">
            <p className="text-sm text-muted-foreground">A HighLife (B36/S23) replicator draws a Sierpinski triangle in spacetime (box-count D ≈ 1.65). A GA evolved Bomber placements to enrich it; honest result: the Bomber destroys the replicator, so nothing truly beat the baseline.</p>
            <a href={`${B}/hub-assets/highlife_compare.png`} target="_blank" rel="noreferrer"><img src={`${B}/hub-assets/highlife_compare.png`} alt="HighLife baseline vs evolved runs" className="rounded-lg border border-border/50 w-full" /></a>
            <div className="flex gap-2"><a className={btn} target="_blank" rel="noreferrer" href={`${B}/hub-assets/highlife_report.md`}>Full report (.md)</a></div>
          </Tile>
        </div>
      </div>
    </Layout>
  );
}
