import { useEffect, useRef, useState } from "react";

interface DataPoint { t: number; v: number; }
interface Metrics {
  cpu: { usage: number; cores: number; model: string; loadAvg: number[] };
  memory: { total: number; used: number; free: number; pct: number };
  disk: { pct: number };
  uptime: number;
  hostname: string;
  processes: { pid: number; name: string; cpu: number; mem: number }[];
}

function sparkline(data: DataPoint[], width: number, height: number, color: string) {
  if (data.length < 2) return null;
  const vals = data.map(d => d.v);
  const min = 0, max = 100;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.v - min) / (max - min)) * height;
    return `${x},${y}`;
  });
  const last = vals[vals.length - 1];
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`g${color.replace(/[^a-z]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" />
      <text x={width - 2} y={8} fill={color} fontSize="7" textAnchor="end" fontFamily="JetBrains Mono, monospace">{last}%</text>
    </svg>
  );
}

function fmt(bytes: number) {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  return (bytes / 1e6).toFixed(0) + " MB";
}

function fmtUptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

export function SystemMonitorApp() {
  const [tab, setTab] = useState<"cpu" | "memory" | "network" | "processes">("cpu");
  const [cpuHist, setCpuHist] = useState<DataPoint[]>([]);
  const [memHist, setMemHist] = useState<DataPoint[]>([]);
  const [netHist, setNetHist] = useState<DataPoint[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = async () => {
    try {
      const r = await fetch("/api/system/metrics");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data: Metrics = await r.json();
      setMetrics(data);
      setError("");
      const t = Date.now();
      setCpuHist(prev => [...prev.slice(-49), { t, v: data.cpu.usage }]);
      setMemHist(prev => [...prev.slice(-49), { t, v: data.memory.pct }]);
      setNetHist(prev => [...prev.slice(-49), { t, v: Math.round(Math.random() * 15 + 2) }]);
    } catch (e: any) {
      setError(e?.message);
    }
  };

  useEffect(() => {
    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const TABS = ["cpu", "memory", "network", "processes"] as const;

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,65%,4%)", fontFamily: "'JetBrains Mono', monospace" }}>
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background: "hsl(220,60%,6%)", borderBottom: "1px solid rgba(0,212,255,0.12)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(140,100%,50%)" }} />
          <span style={{ color: "hsl(185,80%,55%)", fontSize: "0.65rem", letterSpacing: "0.12em" }}>SYSTEM MONITOR</span>
        </div>
        {metrics && (
          <span style={{ color: "hsl(185,40%,45%)", fontSize: "0.6rem" }}>
            {metrics.hostname} · up {fmtUptime(metrics.uptime)}
          </span>
        )}
      </div>

      <div className="flex gap-1 px-3 py-1.5 shrink-0" style={{ borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-2 py-0.5 rounded text-xs uppercase transition-all"
            style={{
              background: tab === t ? "rgba(0,212,255,0.12)" : "transparent",
              border: `1px solid ${tab === t ? "rgba(0,212,255,0.3)" : "rgba(0,212,255,0.08)"}`,
              color: tab === t ? "hsl(185,100%,55%)" : "hsl(185,30%,40%)",
              fontSize: "0.55rem",
              letterSpacing: "0.08em",
            }}
          >
            {t}
          </button>
        ))}
        {error && <span style={{ color: "hsl(0,80%,60%)", fontSize: "0.55rem", marginLeft: "auto" }}>⚠ {error}</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "cpu" && (
          <div className="space-y-4">
            <div className="rounded p-3" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)" }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: "hsl(185,60%,50%)", fontSize: "0.6rem" }}>CPU USAGE</span>
                <span style={{ color: "hsl(185,100%,60%)", fontSize: "0.7rem" }}>{metrics?.cpu.usage ?? 0}%</span>
              </div>
              <div className="w-full">{sparkline(cpuHist, 280, 40, "hsl(185,100%,50%)")}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem" }}>CORES</div>
                  <div style={{ color: "hsl(185,70%,60%)", fontSize: "0.65rem" }}>{metrics?.cpu.cores ?? "—"}</div>
                </div>
                <div>
                  <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem" }}>LOAD AVG (1m)</div>
                  <div style={{ color: "hsl(185,70%,60%)", fontSize: "0.65rem" }}>{metrics?.cpu.loadAvg[0].toFixed(2) ?? "—"}</div>
                </div>
              </div>
              <div className="mt-1">
                <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem" }}>MODEL</div>
                <div style={{ color: "hsl(185,50%,55%)", fontSize: "0.58rem" }} className="truncate">{metrics?.cpu.model ?? "—"}</div>
              </div>
            </div>
            <div className="rounded p-3" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)" }}>
              <div className="flex justify-between mb-1">
                <span style={{ color: "hsl(185,60%,50%)", fontSize: "0.6rem" }}>DISK USAGE</span>
                <span style={{ color: "hsl(185,100%,60%)", fontSize: "0.7rem" }}>{metrics?.disk.pct ?? 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,212,255,0.1)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${metrics?.disk.pct ?? 0}%`, background: "hsl(185,100%,50%)" }} />
              </div>
            </div>
          </div>
        )}

        {tab === "memory" && (
          <div className="space-y-4">
            <div className="rounded p-3" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)" }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: "hsl(185,60%,50%)", fontSize: "0.6rem" }}>RAM USAGE</span>
                <span style={{ color: "hsl(185,100%,60%)", fontSize: "0.7rem" }}>{metrics?.memory.pct ?? 0}%</span>
              </div>
              <div className="w-full">{sparkline(memHist, 280, 40, "hsl(270,90%,60%)")}</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { label: "USED", val: metrics ? fmt(metrics.memory.used) : "—" },
                  { label: "FREE", val: metrics ? fmt(metrics.memory.free) : "—" },
                  { label: "TOTAL", val: metrics ? fmt(metrics.memory.total) : "—" },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem" }}>{label}</div>
                    <div style={{ color: "hsl(185,70%,60%)", fontSize: "0.65rem" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,212,255,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${metrics?.memory.pct ?? 0}%`, background: "linear-gradient(90deg, hsl(270,90%,50%), hsl(185,100%,50%))" }} />
            </div>
          </div>
        )}

        {tab === "network" && (
          <div className="space-y-4">
            <div className="rounded p-3" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)" }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: "hsl(185,60%,50%)", fontSize: "0.6rem" }}>NETWORK I/O</span>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(140,100%,50%)" }} />
              </div>
              <div className="w-full">{sparkline(netHist, 280, 40, "hsl(140,100%,50%)")}</div>
              <div className="mt-3 space-y-1">
                {[
                  { ip: "84.291.0.1",     label: "MESH NODE — ACTIVE",      color: "hsl(140,80%,55%)" },
                  { ip: "192.168.1.1",    label: "GATEWAY",                  color: "hsl(185,70%,55%)" },
                  { ip: "192.168.1.44",   label: "SSH ATTEMPT — BLOCKED",    color: "hsl(0,80%,55%)" },
                ].map(({ ip, label, color }) => (
                  <div key={ip} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <span style={{ color: "hsl(185,50%,50%)", fontSize: "0.58rem", fontFamily: "JetBrains Mono" }}>{ip}</span>
                    <span style={{ color, fontSize: "0.55rem" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "processes" && (
          <div>
            <div className="grid grid-cols-4 gap-1 mb-1 px-1" style={{ color: "hsl(185,30%,40%)", fontSize: "0.55rem" }}>
              <span>PID</span><span className="col-span-2">NAME</span><span className="text-right">CPU%</span>
            </div>
            <div className="space-y-0.5">
              {(metrics?.processes ?? []).slice(0, 12).map((p, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-1 px-1 py-0.5 rounded"
                  style={{ background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.06)" }}
                >
                  <span style={{ color: "hsl(185,30%,45%)", fontSize: "0.58rem" }}>{p.pid}</span>
                  <span className="col-span-2 truncate" style={{ color: "hsl(185,60%,55%)", fontSize: "0.58rem" }}>{p.name}</span>
                  <span className="text-right" style={{ color: p.cpu > 5 ? "hsl(30,100%,60%)" : "hsl(185,50%,50%)", fontSize: "0.58rem" }}>
                    {p.cpu.toFixed(1)}
                  </span>
                </div>
              ))}
              {!metrics && <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.6rem" }}>Loading processes...</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
