import { useEffect, useState } from "react";

interface AiAgent {
  id: number;
  name: string;
  version: string;
  platform: string;
  status: string;
  ethicsScore: number;
  actionsLastHour: number;
  flaggedActions: number;
  isolatedAt: string | null;
  reason: string | null;
  createdAt: string;
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; glow: string }> = {
    safe: { bg: "rgba(0,255,128,0.15)", color: "hsl(140,100%,50%)", glow: "rgba(0,255,128,0.5)" },
    warning: { bg: "rgba(255,140,0,0.15)", color: "hsl(30,100%,60%)", glow: "rgba(255,140,0,0.4)" },
    isolated: { bg: "rgba(255,0,64,0.15)", color: "hsl(0,100%,60%)", glow: "rgba(255,0,64,0.4)" },
    offline: { bg: "rgba(160,0,255,0.15)", color: "hsl(270,100%,65%)", glow: "rgba(160,0,255,0.4)" },
  };
  const c = cfg[status] || cfg.safe;
  return (
    <span
      className="px-2 py-0.5 rounded-full font-bold"
      style={{
        background: c.bg,
        color: c.color,
        fontSize: "0.6rem",
        letterSpacing: "0.1em",
        border: `1px solid ${c.color}30`,
        textShadow: `0 0 6px ${c.glow}`,
      }}
    >
      ● {status.toUpperCase()}
    </span>
  );
}

function EthicsBar({ value }: { value: number }) {
  const color =
    value >= 90 ? "hsl(140,100%,50%)" : value >= 70 ? "hsl(185,100%,50%)" : "hsl(0,100%,55%)";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span style={{ color: "hsl(185,40%,45%)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>ETHICS SCORE</span>
        <span style={{ color, fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold" }}>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 4px ${color}` }}
        />
      </div>
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  android: "ANDROID",
  ios: "iOS",
  windows: "WINDOWS",
  macos: "macOS",
  linux: "LINUX",
  cloud: "CLOUD",
  embedded: "EMBEDDED",
};

export default function Agents() {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => {
        setAgents(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const safeCount = agents.filter((a) => a.status === "safe").length;
  const isolatedCount = agents.filter((a) => a.status === "isolated").length;
  const warningCount = agents.filter((a) => a.status === "warning").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-2xl font-black tracking-widest"
            style={{
              color: "hsl(185,100%,50%)",
              textShadow: "0 0 16px rgba(0,212,255,0.5)",
              letterSpacing: "0.2em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ◈ AI AGENT MONITOR
          </div>
          <div className="text-xs mt-1" style={{ color: "hsl(185,40%,45%)", letterSpacing: "0.1em" }}>
            {safeCount} safe · {warningCount} warning · {isolatedCount} isolated — Rogue AI detection active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "SAFE", value: safeCount, color: "hsl(140,100%,50%)" },
          { label: "WARNING", value: warningCount, color: "hsl(30,100%,55%)" },
          { label: "ISOLATED", value: isolatedCount, color: "hsl(0,100%,55%)" },
          { label: "OFFLINE", value: agents.filter((a) => a.status === "offline").length, color: "hsl(270,100%,65%)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded p-3 text-center"
            style={{ background: "hsl(220,55%,7%)", border: `1px solid ${s.color}25` }}
          >
            <div style={{ color: s.color, fontSize: "1.5rem", fontWeight: "900", fontFamily: "'JetBrains Mono', monospace", textShadow: `0 0 8px ${s.color}80` }}>
              {s.value}
            </div>
            <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.12em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: "hsl(185,60%,50%)" }}>
          <div className="text-2xl mb-2">⟳</div>
          <div className="text-sm tracking-widest">LOADING AGENTS...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded p-5"
              style={{
                background: "hsl(220,55%,7%)",
                border: agent.status === "safe"
                  ? "1px solid rgba(0,212,255,0.2)"
                  : agent.status === "isolated"
                  ? "1px solid rgba(255,0,64,0.3)"
                  : agent.status === "warning"
                  ? "1px solid rgba(255,140,0,0.25)"
                  : "1px solid rgba(0,212,255,0.1)",
                boxShadow: agent.status === "isolated"
                  ? "0 0 16px rgba(255,0,64,0.1)"
                  : agent.status === "safe"
                  ? "0 0 12px rgba(0,212,255,0.06)"
                  : "none",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div
                    className="font-black text-base mb-0.5"
                    style={{
                      color: "hsl(185,100%,85%)",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {agent.name}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(0,212,255,0.08)",
                        color: "hsl(185,70%,55%)",
                        fontSize: "0.6rem",
                        border: "1px solid rgba(0,212,255,0.15)",
                      }}
                    >
                      {PLATFORM_LABELS[agent.platform] || agent.platform.toUpperCase()}
                    </span>
                    <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.6rem" }}>v{agent.version}</span>
                  </div>
                </div>
                <StatusPill status={agent.status} />
              </div>

              {agent.status === "isolated" && agent.reason && (
                <div
                  className="rounded p-2 mb-3 text-xs"
                  style={{
                    background: "rgba(255,0,64,0.08)",
                    border: "1px solid rgba(255,0,64,0.2)",
                    color: "hsl(0,100%,65%)",
                    fontSize: "0.7rem",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <span style={{ color: "hsl(0,80%,45%)", fontSize: "0.6rem" }}>ISOLATION REASON → </span>
                  {agent.reason}
                </div>
              )}

              <div className="mb-3">
                <EthicsBar value={agent.ethicsScore} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "ACTIONS/HR", value: agent.actionsLastHour.toLocaleString() },
                  { label: "FLAGGED", value: agent.flaggedActions.toLocaleString() },
                  {
                    label: "DEPLOYED",
                    value: new Date(agent.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>
                      {stat.label}
                    </div>
                    <div
                      style={{
                        color: stat.label === "FLAGGED" && agent.flaggedActions > 0
                          ? "hsl(0,100%,60%)"
                          : "hsl(185,80%,65%)",
                        fontSize: "0.75rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: "bold",
                        textShadow: stat.label === "FLAGGED" && agent.flaggedActions > 0
                          ? "0 0 6px rgba(255,0,64,0.5)"
                          : "none",
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
