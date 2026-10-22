import { useEffect, useState } from "react";

interface DashboardSummary {
  totalNodes: number;
  threatsBlockedToday: number;
  agentsMonitored: number;
  agentsIsolated: number;
  selfHealEvents: number;
  protectionEvents: number;
  uptimePercent: number;
  patchesShared: number;
  childSafetyAlerts: number;
  networkHealthScore: number;
}

interface ThreatEvent {
  id: number;
  category: string;
  severity: string;
  status: string;
  description: string;
  sourceIp: string;
  caseId: string | null;
  reportedToAuthorities: boolean;
  timestamp: string;
}

function StatCard({
  label,
  value,
  sub,
  color = "cyan",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "cyan" | "green" | "red" | "orange" | "purple";
  icon: string;
}) {
  const colors = {
    cyan: { primary: "hsl(185,100%,50%)", glow: "rgba(0,212,255,0.3)", border: "rgba(0,212,255,0.2)" },
    green: { primary: "hsl(140,100%,50%)", glow: "rgba(0,255,128,0.3)", border: "rgba(0,255,128,0.2)" },
    red: { primary: "hsl(0,100%,55%)", glow: "rgba(255,0,64,0.3)", border: "rgba(255,0,64,0.2)" },
    orange: { primary: "hsl(30,100%,55%)", glow: "rgba(255,140,0,0.3)", border: "rgba(255,140,0,0.2)" },
    purple: { primary: "hsl(270,100%,65%)", glow: "rgba(160,0,255,0.3)", border: "rgba(160,0,255,0.2)" },
  };
  const c = colors[color];
  return (
    <div
      className="rounded p-4 flex flex-col gap-2"
      style={{
        background: "hsl(220,55%,7%)",
        border: `1px solid ${c.border}`,
        boxShadow: `0 0 16px ${c.glow}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs tracking-widest font-medium"
          style={{ color: "hsl(185,40%,50%)", fontSize: "0.6rem", letterSpacing: "0.15em" }}
        >
          {label}
        </span>
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      </div>
      <div
        className="text-3xl font-black"
        style={{
          color: c.primary,
          textShadow: `0 0 16px ${c.glow}`,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "hsl(185,40%,45%)", fontSize: "0.65rem" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ThreatBadge({ severity }: { severity: string }) {
  const cfg: Record<string, { bg: string; text: string }> = {
    critical: { bg: "rgba(255,0,64,0.2)", text: "hsl(0,100%,60%)" },
    high: { bg: "rgba(255,140,0,0.2)", text: "hsl(30,100%,60%)" },
    medium: { bg: "rgba(0,212,255,0.15)", text: "hsl(185,100%,60%)" },
    low: { bg: "rgba(0,255,128,0.15)", text: "hsl(140,100%,55%)" },
  };
  const c = cfg[severity] || cfg.medium;
  return (
    <span
      className="px-2 py-0.5 rounded font-bold whitespace-nowrap"
      style={{
        background: c.bg,
        color: c.text,
        fontSize: "0.6rem",
        letterSpacing: "0.08em",
        border: `1px solid ${c.text}30`,
      }}
    >
      {severity.toUpperCase()}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    blocked: "hsl(140,100%,50%)",
    reported: "hsl(30,100%,55%)",
    resolved: "hsl(185,100%,50%)",
    detected: "hsl(270,100%,65%)",
  };
  const color = cfg[status] || "hsl(185,60%,50%)";
  return (
    <span className="whitespace-nowrap" style={{ color, fontSize: "0.6rem", fontWeight: "bold" }}>
      ● {status.toUpperCase()}
    </span>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/summary").then((r) => r.json()),
      fetch("/api/threats?limit=8").then((r) => r.json()),
    ])
      .then(([summaryData, threatsData]) => {
        setSummary(summaryData);
        setThreats(Array.isArray(threatsData) ? threatsData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-2xl font-black tracking-widest"
            style={{
              color: "hsl(185,100%,50%)",
              textShadow: "0 0 16px rgba(0,212,255,0.6)",
              letterSpacing: "0.2em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            MISSION CONTROL
          </div>
          <div className="text-xs mt-1" style={{ color: "hsl(185,40%,45%)", letterSpacing: "0.1em" }}>
            FRAMELESS OS — Real-Time Security Operations Center
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-xl font-bold"
            style={{
              color: "hsl(185,100%,50%)",
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: "0 0 8px rgba(0,212,255,0.5)",
            }}
          >
            {timeStr}
          </div>
          <div className="text-xs" style={{ color: "hsl(185,40%,45%)", fontSize: "0.65rem" }}>
            {dateStr} UTC
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: "hsl(185,60%,50%)" }}>
          <div className="text-3xl mb-3 animate-spin">⟳</div>
          <div className="text-sm tracking-widest">LOADING TELEMETRY...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="THREATS BLOCKED TODAY"
              value={summary?.threatsBlockedToday ?? 0}
              sub="Since midnight UTC"
              color="red"
              icon="⚠"
            />
            <StatCard
              label="AI AGENTS"
              value={`${(summary?.agentsMonitored ?? 0) - (summary?.agentsIsolated ?? 0)}/${summary?.agentsMonitored ?? 0}`}
              sub={`${summary?.agentsIsolated ?? 0} isolated`}
              color="cyan"
              icon="◈"
            />
            <StatCard
              label="ONLINE NODES"
              value={summary?.totalNodes ?? 0}
              sub="Active in global mesh"
              color="green"
              icon="⬟"
            />
            <StatCard
              label="SELF-HEAL EVENTS"
              value={summary?.selfHealEvents ?? 0}
              sub="Today's recoveries"
              color="green"
              icon="⟳"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="CHILD SAFETY ALERTS"
              value={summary?.childSafetyAlerts ?? 0}
              sub="Active incidents"
              color="purple"
              icon="⛨"
            />
            <StatCard
              label="PROTECTION EVENTS"
              value={summary?.protectionEvents ?? 0}
              sub="Today total"
              color="orange"
              icon="⛨"
            />
            <StatCard
              label="PATCHES SHARED"
              value={(summary?.patchesShared ?? 0).toLocaleString()}
              sub="Across mesh network"
              color="cyan"
              icon="↗"
            />
            <StatCard
              label="UPTIME"
              value={`${summary?.uptimePercent ?? 0}%`}
              sub="System availability"
              color="green"
              icon="▲"
            />
          </div>

          <div
            className="rounded p-4"
            style={{
              background: "hsl(220,55%,7%)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-sm font-bold tracking-widest"
                style={{ color: "hsl(185,100%,50%)", fontSize: "0.75rem", letterSpacing: "0.15em" }}
              >
                ⚠ LIVE THREAT FEED
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "hsl(0,100%,55%)", boxShadow: "0 0 6px rgba(255,0,64,0.7)" }}
                />
                <span className="text-xs" style={{ color: "hsl(0,100%,55%)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                  LIVE
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {threats.slice(0, 8).map((threat) => (
                <div
                  key={threat.id}
                  className="flex items-center gap-3 p-2 rounded"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(0,212,255,0.07)",
                  }}
                >
                  <ThreatBadge severity={threat.severity} />
                  <span
                    className="text-xs px-2 py-0.5 rounded whitespace-nowrap"
                    style={{
                      background: "rgba(0,212,255,0.07)",
                      color: "hsl(185,80%,60%)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {threat.category.replace("_", " ").toUpperCase()}
                  </span>
                  <span
                    className="flex-1 text-xs truncate"
                    style={{ color: "hsl(185,60%,65%)", fontSize: "0.7rem" }}
                  >
                    {threat.description}
                  </span>
                  <span className="text-xs whitespace-nowrap" style={{ color: "hsl(185,40%,40%)", fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace" }}>
                    {threat.sourceIp}
                  </span>
                  <StatusDot status={threat.status} />
                </div>
              ))}
              {threats.length === 0 && (
                <div className="text-center py-6" style={{ color: "hsl(185,40%,40%)" }}>
                  <div className="text-sm">NO ACTIVE THREATS</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "NETWORK HEALTH", value: summary?.networkHealthScore ?? 0, color: "hsl(140,100%,50%)" },
              { label: "SYSTEM UPTIME", value: summary?.uptimePercent ?? 0, color: "hsl(185,100%,50%)" },
              { label: "PATCH COVERAGE", value: 97.3, color: "hsl(270,100%,65%)" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded p-4"
                style={{
                  background: "hsl(220,55%,7%)",
                  border: "1px solid rgba(0,212,255,0.12)",
                }}
              >
                <div
                  className="text-xs mb-2"
                  style={{ color: "hsl(185,40%,45%)", fontSize: "0.6rem", letterSpacing: "0.12em" }}
                >
                  {item.label}
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span
                    className="text-2xl font-black"
                    style={{
                      color: item.color,
                      fontFamily: "'JetBrains Mono', monospace",
                      textShadow: `0 0 12px ${item.color}80`,
                    }}
                  >
                    {item.value.toFixed(item.value % 1 === 0 ? 0 : 2)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(item.value, 100)}%`,
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
