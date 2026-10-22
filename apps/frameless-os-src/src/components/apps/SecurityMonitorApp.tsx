import { useEffect, useState } from "react";

interface Threat {
  id: number;
  threatId: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  description: string;
  detectedAt: string;
  countryCode?: string;
}

interface Summary {
  threatsToday: number;
  agentsActive: number;
  agentsTotal: number;
  nodesOnline: number;
  nodesTotal: number;
  patchesShared: number;
  healEvents: number;
}

export function SecurityMonitorApp() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [tab, setTab] = useState<"dashboard" | "threats" | "agents">("dashboard");

  useEffect(() => {
    fetch("/api/dashboard/summary").then((r) => r.json()).then(setSummary).catch(() => {});
    fetch("/api/threats?limit=12").then((r) => r.json()).then((d) => setThreats(d.threats || [])).catch(() => {});
  }, []);

  const severityColor = (s: string) => {
    if (s === "critical") return "hsl(0,100%,55%)";
    if (s === "high") return "hsl(30,100%,55%)";
    if (s === "medium") return "hsl(50,100%,55%)";
    return "hsl(185,60%,50%)";
  };

  const statusColor = (s: string) => {
    if (s === "blocked") return "hsl(140,100%,50%)";
    if (s === "investigating") return "hsl(50,100%,55%)";
    if (s === "active") return "hsl(0,100%,55%)";
    return "hsl(185,60%,50%)";
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,55%,6%)", fontFamily: "'JetBrains Mono', monospace" }}>
      <div
        className="flex items-center gap-1 px-3 py-2 shrink-0"
        style={{ background: "hsl(220,60%,7%)", borderBottom: "1px solid rgba(0,212,255,0.12)" }}
      >
        {(["dashboard", "threats", "agents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1 rounded text-xs font-bold tracking-widest transition-all"
            style={{
              background: tab === t ? "rgba(0,212,255,0.15)" : "transparent",
              color: tab === t ? "hsl(185,100%,55%)" : "hsl(185,40%,45%)",
              border: tab === t ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(140,100%,50%)" }} />
          <span style={{ color: "hsl(185,40%,45%)", fontSize: "0.55rem" }}>LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "dashboard" && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: summary.threatsToday, label: "THREATS TODAY", icon: "⚠", color: "hsl(0,100%,55%)" },
                { val: `${summary.agentsActive}/${summary.agentsTotal}`, label: "AI AGENTS ACTIVE", icon: "◈", color: "hsl(185,100%,50%)" },
                { val: `${summary.nodesOnline}/${summary.nodesTotal}`, label: "NODES ONLINE", icon: "⬟", color: "hsl(140,100%,50%)" },
                { val: summary.patchesShared.toLocaleString(), label: "PATCHES SHARED", icon: "⟳", color: "hsl(300,100%,65%)" },
                { val: summary.healEvents, label: "SELF-HEALS TODAY", icon: "❤", color: "hsl(30,100%,55%)" },
                { val: "99.9997%", label: "SYSTEM UPTIME", icon: "⚡", color: "hsl(50,100%,55%)" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded" style={{ background: "hsl(220,55%,7%)", border: `1px solid ${s.color}20` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ color: s.color, fontSize: "0.9rem" }}>{s.icon}</span>
                    <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.5rem", letterSpacing: "0.1em" }}>{s.label}</span>
                  </div>
                  <div style={{ color: s.color, fontSize: "1.3rem", fontWeight: 900, textShadow: `0 0 12px ${s.color}60` }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded" style={{ background: "hsl(220,55%,7%)", border: "1px solid rgba(0,212,255,0.1)" }}>
              <div style={{ color: "hsl(185,60%,60%)", fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "8px" }}>LIVE THREAT FEED</div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {threats.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid rgba(0,212,255,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: severityColor(t.severity), flexShrink: 0 }} />
                      <span style={{ color: "hsl(185,60%,60%)", fontSize: "0.6rem" }}>{t.type}</span>
                      <span style={{ color: "hsl(185,30%,40%)", fontSize: "0.55rem" }}>— {t.source}</span>
                    </div>
                    <span style={{ color: statusColor(t.status), fontSize: "0.55rem", fontWeight: "bold" }}>{t.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "threats" && (
          <div className="space-y-1.5">
            {threats.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded" style={{ background: "hsl(220,55%,7%)", border: "1px solid rgba(0,212,255,0.08)" }}>
                <div className="w-1 h-10 rounded-full" style={{ background: severityColor(t.severity) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ color: "hsl(185,80%,65%)", fontSize: "0.65rem", fontWeight: "bold" }}>{t.type}</span>
                    <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem" }}>{t.threatId}</span>
                  </div>
                  <div style={{ color: "hsl(185,40%,50%)", fontSize: "0.6rem" }} className="truncate">{t.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div style={{ color: severityColor(t.severity), fontSize: "0.55rem", fontWeight: "bold", letterSpacing: "0.1em" }}>{t.severity.toUpperCase()}</div>
                  <div style={{ color: statusColor(t.status), fontSize: "0.55rem" }}>{t.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "agents" && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "NetGuard-Alpha", status: "safe", score: 98, actions: 1247 },
              { name: "CryptoShield-Beta", status: "safe", score: 99, actions: 847 },
              { name: "BehaviorWatch-Gamma", status: "safe", score: 96, actions: 2341 },
              { name: "DataHarvester-9", status: "isolated", score: 12, actions: 84 },
              { name: "ChildGuard-Delta", status: "safe", score: 100, actions: 523 },
              { name: "ThreatHunter-Epsilon", status: "warning", score: 71, actions: 3012 },
              { name: "PatchBot-Zeta", status: "safe", score: 99, actions: 8412 },
              { name: "NetworkSentry-Eta", status: "safe", score: 97, actions: 1891 },
            ].map((a) => {
              const c = a.status === "safe" ? "hsl(140,100%,50%)" : a.status === "warning" ? "hsl(50,100%,55%)" : "hsl(0,100%,55%)";
              return (
                <div key={a.name} className="p-3 rounded" style={{ background: "hsl(220,55%,7%)", border: `1px solid ${c}25` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: "hsl(185,70%,65%)", fontSize: "0.65rem", fontWeight: "bold" }}>{a.name}</span>
                    <span style={{ color: c, fontSize: "0.55rem", fontWeight: "bold" }}>{a.status.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.5rem" }}>ETHICS</div>
                      <div style={{ color: c, fontWeight: "bold", fontSize: "0.75rem" }}>{a.score}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.5rem" }}>ACTIONS</div>
                      <div style={{ color: "hsl(185,60%,55%)", fontWeight: "bold", fontSize: "0.75rem" }}>{a.actions.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
