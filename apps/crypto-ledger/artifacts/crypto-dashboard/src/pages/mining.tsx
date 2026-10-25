import { Layout } from "@/components/layout";
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pickaxe, Zap, Bitcoin, Cpu, Activity, Clock, Copy, Check, Square, Wallet, QrCode } from "lucide-react";

function getApiUrl(path: string) {
  return `/api${path}`;
}

function computePower(blocksMined: number): number {
  if (blocksMined === 0) return 8;
  return Math.min(8 + Math.log(blocksMined + 1) * 2.5, 20);
}

function computeMaxIter(blocksMined: number): number {
  if (blocksMined === 0) return 50;
  return Math.min(Math.floor(50 + Math.log(blocksMined + 1) * 15), 150);
}

type SepoliaToken = { address: string; deployed: boolean; name?: string | null; symbol?: string | null; totalSupply?: number | null; mineable?: boolean; difficulty?: number | null; solves?: number | null; reward?: number | null; maxSupply?: number | null; lastSolveTime?: number | null; recentMints?: { to: string; amount: number | null; block: number; tx: string }[] };

function SepoliaPanel() {
  const { data, isError, isLoading } = useQuery<{ note: string; tokens: SepoliaToken[] }>({
    queryKey: ["sepolia-tokens"], refetchInterval: 60_000,
    queryFn: async () => { const r = await fetch(getApiUrl("/sepolia/tokens")); if (!r.ok) throw new Error("rpc"); return r.json(); },
  });
  const ES = "https://sepolia.etherscan.io";
  const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  return (
    <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4 space-y-3" data-testid="sepolia-panel">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">Simon67 on Sepolia (live, read-only)</h2>
        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">Sepolia testnet, no real value</span>
      </div>
      <p className="text-xs text-muted-foreground">Read straight from the public Sepolia chain. No wallet connection, no keys, nothing to sign.</p>
      {isLoading && <p className="text-sm text-muted-foreground">Reading Sepolia…</p>}
      {isError && <p className="text-sm text-red-300">Could not reach Sepolia right now.</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {data?.tokens.map(t => (
          <div key={t.address} className="rounded-lg border border-border/50 p-3 space-y-2 text-sm">
            <div className="font-semibold">{t.name ?? "Token"} ({t.symbol ?? "?"}) {t.mineable && <span className="ml-1 text-xs text-emerald-300">proof-of-work mineable</span>}</div>
            <a className="text-xs text-sky-300 underline break-all" href={`${ES}/address/${t.address}`} target="_blank" rel="noreferrer">{t.address}</a>
            {!t.deployed ? <p className="text-muted-foreground">Not deployed at this address yet.</p> : (
              <table className="w-full"><tbody>
                <tr><td className="text-muted-foreground">Total supply</td><td className="text-right">{t.totalSupply?.toLocaleString()} {t.symbol}</td></tr>
                {t.maxSupply != null && <tr><td className="text-muted-foreground">Max supply</td><td className="text-right">{t.maxSupply.toLocaleString()}</td></tr>}
                {t.reward != null && <tr><td className="text-muted-foreground">Reward per solve</td><td className="text-right">{t.reward} {t.symbol}</td></tr>}
                {t.difficulty != null && <tr><td className="text-muted-foreground">Difficulty (expected hashes)</td><td className="text-right">{Math.round(t.difficulty).toLocaleString()}</td></tr>}
                {t.solves != null && <tr><td className="text-muted-foreground">Blocks solved</td><td className="text-right">{t.solves}</td></tr>}
                {t.lastSolveTime != null && <tr><td className="text-muted-foreground">Last solve</td><td className="text-right">{new Date(t.lastSolveTime * 1000).toLocaleString()}</td></tr>}
              </tbody></table>)}
            {!!t.recentMints?.length && (<div><div className="text-xs text-muted-foreground mb-1">Recent mints</div>
              {t.recentMints.map(m => (<div key={m.tx} className="flex justify-between text-xs"><a className="text-sky-300 underline" href={`${ES}/tx/${m.tx}`} target="_blank" rel="noreferrer">block {m.block}</a><span>{short(m.to)}</span><span>+{m.amount?.toLocaleString()}</span></div>))}
            </div>)}
          </div>))}
      </div>
    </div>
  );
}

function renderMandelbulb(
  canvas: HTMLCanvasElement,
  power: number,
  maxIter: number,
  wSlice: number,
  colorMode: "inferno" | "gold"
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  const bound = 1.5;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const cx = ((px / width) * 2 - 1) * bound;
      const cy = ((py / height) * 2 - 1) * bound;

      let zx = 0, zy = 0, zz = 0, zw = 0;
      let escaped = false;
      let smoothIter = 0;

      for (let i = 0; i < maxIter; i++) {
        const r_xy = Math.sqrt(zx * zx + zy * zy);
        const r_xyz = Math.sqrt(r_xy * r_xy + zz * zz);
        const r = Math.sqrt(r_xyz * r_xyz + zw * zw);

        if (r > 4.0) {
          smoothIter = i + 1 - Math.log(Math.log(r) / Math.log(4.0)) / Math.log(power);
          escaped = true;
          break;
        }

        if (r === 0) {
          zx = cx; zy = cy; zz = 0; zw = wSlice;
          continue;
        }

        const phi = Math.atan2(zy, zx);
        const theta = Math.atan2(zz, r_xy);
        const psi = Math.atan2(zw, r_xyz);

        const rn = Math.pow(r, power);
        const phin = power * phi;
        const thetan = power * theta;
        const psin = power * psi;

        const cosPsi = Math.cos(psin);
        const cosTheta = Math.cos(thetan);

        zx = rn * cosPsi * cosTheta * Math.cos(phin) + cx;
        zy = rn * cosPsi * cosTheta * Math.sin(phin) + cy;
        zz = rn * cosPsi * Math.sin(thetan) + 0;
        zw = rn * Math.sin(psin) + wSlice;
      }

      const idx = (py * width + px) * 4;
      if (!escaped) {
        data[idx] = 5;
        data[idx + 1] = 3;
        data[idx + 2] = 2;
        data[idx + 3] = 255;
      } else {
        const t = Math.min(smoothIter / maxIter, 1);

        let r: number, g: number, b: number;
        if (colorMode === "gold") {
          r = Math.min(255, Math.floor(255 * Math.max(0, 0.8 + 0.3 * t)));
          g = Math.min(255, Math.floor(255 * Math.max(0, 0.4 * t * t + 0.3 * t)));
          b = Math.min(255, Math.floor(255 * Math.max(0, 0.05 * t)));
        } else {
          const t2 = t * t;
          r = Math.min(255, Math.floor(255 * Math.max(0, 1.70 * t - 0.42)));
          g = Math.min(255, Math.floor(255 * Math.max(0, t < 0.5
            ? 1.8 * t2
            : -1.8 * t2 + 3.6 * t - 1.0)));
          b = Math.min(255, Math.floor(255 * Math.max(0, t < 0.35
            ? 2.5 * t
            : Math.max(0, -3.5 * t + 2.4))));
        }

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

interface MiningBlock {
  id: number;
  blockNum: number;
  hash: string;
  btcReward: number;
  ethReward: number;
  gasFee: number;
  powerSnapshot: number;
  wSliceSnapshot: number;
  minedAt: string;
}

interface MiningWallet {
  totalBtc: number;
  totalEth: number;
  totalGas: number;
  blocksMined: number;
  lastMinedAt: string | null;
  destinationWallet1?: string;
  destinationWallet2?: string;
  fractal?: { power: number; maxIter: number };
}

interface MineResult {
  block: MiningBlock;
  wallet: MiningWallet;
  fractal: { power: number; maxIter: number; wSlice: number };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
      title="Copy address"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function MiningPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wSliceRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const renderingRef = useRef(false);
  const miningSpeedRef = useRef(1);
  const colorModeRef = useRef<"inferno" | "gold">("inferno");
  const lastMineTimeRef = useRef<number[]>([]);

  const [autoMine, setAutoMine] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [fractalPower, setFractalPower] = useState(8);
  const [fractalMaxIter, setFractalMaxIter] = useState(50);
  const [recentBlocks, setRecentBlocks] = useState<MiningBlock[]>([]);

  const queryClient = useQueryClient();

  const { data: wallet } = useQuery<MiningWallet>({
    queryKey: ["mining-wallet"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/mining/wallet"));
      if (!res.ok) throw new Error("Failed to fetch wallet");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: blocks } = useQuery<MiningBlock[]>({
    queryKey: ["mining-blocks"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/mining/blocks"));
      if (!res.ok) throw new Error("Failed to fetch blocks");
      return res.json();
    },
  });

  useEffect(() => {
    if (blocks) setRecentBlocks(blocks);
  }, [blocks]);

  useEffect(() => {
    if (wallet) {
      setFractalPower(computePower(wallet.blocksMined));
      setFractalMaxIter(computeMaxIter(wallet.blocksMined));
    }
  }, [wallet]);

  const mineMutation = useMutation<MineResult>({
    mutationFn: async () => {
      const res = await fetch(getApiUrl("/mining/mine"), { method: "POST" });
      if (!res.ok) throw new Error("Mining failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mining-wallet"] });

      setRecentBlocks((prev) => [data.block, ...prev].slice(0, 50));
      setFractalPower(data.fractal.power);
      setFractalMaxIter(data.fractal.maxIter);
      wSliceRef.current = data.fractal.wSlice;

      colorModeRef.current = "gold";
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
        colorModeRef.current = "inferno";
      }, 800);

      const now = Date.now();
      lastMineTimeRef.current = [now, ...lastMineTimeRef.current.filter(t => now - t < 10000)].slice(0, 10);

      triggerRender(data.fractal.power, data.fractal.maxIter, data.fractal.wSlice, "gold");
    },
  });

  const triggerRender = useCallback(
    (power: number, maxIter: number, wSlice: number, colorMode: "inferno" | "gold") => {
      const canvas = canvasRef.current;
      if (!canvas || renderingRef.current) return;
      renderingRef.current = true;
      setTimeout(() => {
        renderMandelbulb(canvas, power, maxIter, wSlice, colorMode);
        renderingRef.current = false;
      }, 10);
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = Math.min(canvas.parentElement?.clientWidth ?? 500, 500);
    canvas.width = size;
    canvas.height = size;
    renderMandelbulb(canvas, fractalPower, fractalMaxIter, wSliceRef.current, "inferno");
  }, []);

  useEffect(() => {
    let lastTime = 0;

    const animate = (ts: number) => {
      const recentCount = lastMineTimeRef.current.filter(t => Date.now() - t < 5000).length;
      const baseSpeed = 0.003;
      const miningBoost = recentCount * 0.004;
      miningSpeedRef.current = baseSpeed + miningBoost;

      if (ts - lastTime > 200 && !renderingRef.current) {
        wSliceRef.current += miningSpeedRef.current;
        if (wSliceRef.current > 1.5) wSliceRef.current = -1.5;
        const canvas = canvasRef.current;
        if (canvas) {
          renderMandelbulb(canvas, fractalPower, fractalMaxIter, wSliceRef.current, colorModeRef.current);
        }
        lastTime = ts;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [fractalPower, fractalMaxIter]);

  useEffect(() => {
    if (!autoMine) return;
    const interval = setInterval(() => {
      if (!mineMutation.isPending) {
        mineMutation.mutate();
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [autoMine, mineMutation]);

  const blocksMined = wallet?.blocksMined ?? 0;
  const hashRate = lastMineTimeRef.current.length > 1
    ? (lastMineTimeRef.current.length / 10).toFixed(2)
    : "0.00";
  const difficulty = Math.floor(fractalPower * 100);

  const destWallet1 = wallet?.destinationWallet1 ?? "Loading...";
  const destWallet2 = wallet?.destinationWallet2 ?? "Loading...";

  function formatBtc(val: number | undefined) {
    return (val ?? 0).toFixed(8);
  }
  function formatGas(val: number | undefined) {
    return (val ?? 0).toFixed(6);
  }
  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <SepoliaPanel />
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Bitcoin className="w-4 h-4 text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Fractal Mining Simulation <span className="ml-2 align-middle text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">Simulation, not real crypto</span></h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Simulation, not real crypto: fake "blocks" with made-up BTC/ETH numbers that expand the 4D Mandelbulb fractal
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Blocks Mined</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">{blocksMined}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Hash Rate</span>
            </div>
            <div className="text-2xl font-bold text-green-400 font-mono">{hashRate} <span className="text-sm text-muted-foreground">H/s</span></div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Difficulty</span>
            </div>
            <div className="text-2xl font-bold text-purple-400 font-mono">{difficulty}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Pickaxe className="w-3.5 h-3.5" />
              <span>Fractal Power</span>
            </div>
            <div className="text-2xl font-bold text-orange-400 font-mono">{fractalPower.toFixed(1)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div
              className="relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-black/60"
              style={{
                borderColor: isFlashing ? "rgb(251 146 60)" : "rgba(255,255,255,0.1)",
                boxShadow: isFlashing ? "0 0 30px rgba(251,146,60,0.5)" : "none",
              }}
            >
              <canvas
                ref={canvasRef}
                className="block w-full"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/70 text-xs text-orange-300 border border-orange-500/30 font-mono">
                P={fractalPower.toFixed(1)} I={fractalMaxIter} W={wSliceRef.current.toFixed(3)}
              </div>
              {autoMine && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-green-900/70 text-xs text-green-300 border border-green-500/30 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Mining
                </div>
              )}
              {isFlashing && (
                <div className="absolute inset-0 bg-orange-500/10 pointer-events-none flex items-center justify-center">
                  <div className="text-orange-400 text-lg font-bold animate-bounce">Block Mined!</div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => mineMutation.mutate()}
                disabled={mineMutation.isPending || autoMine}
                className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Pickaxe className="w-4 h-4" />
                {mineMutation.isPending ? "Mining..." : "Mine Block"}
              </button>

              <button
                onClick={() => setAutoMine((v) => !v)}
                className={`px-5 py-3 rounded-xl border font-semibold text-sm transition-colors flex items-center gap-2 ${
                  autoMine
                    ? "bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30"
                    : "bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30"
                }`}
              >
                {autoMine ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Stop Mining
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Start Auto-Mine
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                <Bitcoin className="w-4 h-4 text-orange-400" />
                Simulated Counters (not real crypto)
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">BTC Balance</div>
                    <div className="font-mono text-sm font-bold text-orange-400">{formatBtc(wallet?.totalBtc)} sim-BTC</div>
                  </div>
                  <Bitcoin className="w-6 h-6 text-orange-400/60" />
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">ETH Balance</div>
                    <div className="font-mono text-sm font-bold text-blue-400">{(wallet?.totalEth ?? 0).toFixed(6)} sim-ETH</div>
                  </div>
                  <Zap className="w-6 h-6 text-blue-400/60" />
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Gas Spent</div>
                    <div className="font-mono text-sm font-bold text-purple-400">{formatGas(wallet?.totalGas)} sim-ETH</div>
                  </div>
                  <Zap className="w-6 h-6 text-purple-400/60" />
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                  <span>Last mined</span>
                  <span className="font-mono">
                    {wallet?.lastMinedAt ? timeAgo(wallet.lastMinedAt) : "Never"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-5 space-y-2">
              <h3 className="font-semibold text-yellow-300 text-sm uppercase tracking-wider">Simulation, not real crypto</h3>
              <p className="text-xs text-yellow-100/80">Nothing is mined and nothing is ever sent to any wallet. The BTC/ETH numbers on this page are random values stored in a local database to drive the fractal animation. They are not holdings and are not included in your portfolio.</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-2">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Fractal Growth
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Power</span>
                  <span className="font-mono text-orange-400">{fractalPower.toFixed(2)}</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-500"
                    style={{ width: `${((fractalPower - 8) / 12) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Iterations</span>
                  <span className="font-mono text-purple-400">{fractalMaxIter}</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                    style={{ width: `${((fractalMaxIter - 50) / 100) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">W-Slice Speed</span>
                  <span className="font-mono text-green-400">{miningSpeedRef.current.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Recent Blocks
            </h3>
            <span className="text-xs text-muted-foreground">{recentBlocks.length} blocks</span>
          </div>

          <div className="overflow-x-auto">
            {recentBlocks.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No blocks mined yet. Auto-mine is running — blocks will appear shortly!
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground">
                    <th className="text-left px-5 py-3 font-medium">Block #</th>
                    <th className="text-left px-5 py-3 font-medium">Hash</th>
                    <th className="text-right px-5 py-3 font-medium">BTC Reward</th>
                    <th className="text-right px-5 py-3 font-medium">ETH Mined</th>
                    <th className="text-right px-5 py-3 font-medium">Gas Fee (ETH)</th>
                    <th className="text-right px-5 py-3 font-medium">Power</th>
                    <th className="text-right px-5 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBlocks.map((block, i) => (
                    <tr
                      key={block.id}
                      className={`border-b border-border/20 transition-colors ${i === 0 ? "bg-orange-500/5" : "hover:bg-white/2"}`}
                    >
                      <td className="px-5 py-3 font-mono text-foreground">#{block.blockNum}</td>
                      <td className="px-5 py-3 font-mono text-muted-foreground">
                        {block.hash.slice(0, 20)}...
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-orange-400">
                        +{block.btcReward.toFixed(8)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-blue-400">
                        +{(block.ethReward ?? 0).toFixed(8)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-purple-400">
                        -{block.gasFee.toFixed(8)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-blue-400">
                        {block.powerSnapshot.toFixed(1)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {timeAgo(block.minedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
