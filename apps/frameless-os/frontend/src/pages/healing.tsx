import { useEffect, useState } from "react";

interface HealingLog {
  id: number;
  errorCode: string;
  component: string;
  description: string;
  resolution: string;
  healTimeMs: number;
  patchShared: boolean;
  nodesPatched: number;
  timestamp: string;
}

function ComponentBadge({ component }: { component: string }) {
  const colors: Record<string, string> = {
    kernel: "hsl(0,100%,55%)",
    network: "hsl(185,100%,50%)",
    memory: "hsl(30,100%,55%)",
    filesystem: "hsl(50,100%,55%)",
    security: "hsl(270,100%,65%)",
    display: "hsl(140,80%,55%)",
    driver: "hsl(30,80%,55%)",
    bootloader: "hsl(0,80%,55%)",
  };
  const key = Object.keys(colors).find((k) => component.toLowerCase().includes(k)) || "";
  const color = colors[key] || "hsl(185,80%,55%)";
  return (
    <span
      className="px-2 py-0.5 rounded"
      style={{
        background: `${color}18`,
        color,
        fontSize: "0.6rem",
        letterSpacing: "0.06em",
        border: `1px solid ${color}30`,
      }}
    >
      {component.toUpperCase()}
    </span>
  );
}

function HealTime({ ms }: { ms: number }) {
  const color = ms < 500 ? "hsl(140,100%,50%)" : ms < 2000 ? "hsl(185,100%,50%)" : "hsl(30,100%,55%)";
  const label = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  return (
    <span style={{ color, fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold", fontSize: "0.85rem", textShadow: `0 0 8px ${color}80` }}>
      {label}
    </span>
  );
}

export default function Healing() {
  const [logs, setLogs] = useState<HealingLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/healing")
      .then((r) => r.json())
      .then((d) => {
        setLogs(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalPatched = logs.reduce((sum, l) => sum + l.nodesPatched, 0);
  const avgHealTime = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + l.healTimeMs, 0) / logs.length)
    : 0;
  const patchSharedCount = logs.filter((l) => l.patchShared).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-2xl font-black tracking-widest"
            style={{
              color: "hsl(140,100%,50%)",
              textShadow: "0 0 16px rgba(0,255,128,0.5)",
              letterSpacing: "0.2em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ⟳ SELF-HEALING LOG
          </div>
          <div className="text-xs mt-1" style={{ color: "hsl(185,40%,45%)", letterSpacing: "0.1em" }}>
            Autonomous recovery system — Zero human intervention required
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "TOTAL HEALS", value: logs.length, color: "hsl(140,100%,50%)" },
          { label: "AVG HEAL TIME", value: `${avgHealTime}ms`, color: "hsl(185,100%,50%)" },
          { label: "NODES PATCHED", value: totalPatched.toLocaleString(), color: "hsl(30,100%,55%)" },
          { label: "PATCHES SHARED", value: patchSharedCount, color: "hsl(270,100%,65%)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded p-4 text-center"
            style={{ background: "hsl(220,55%,7%)", border: `1px solid ${s.color}25` }}
          >
            <div style={{ color: s.color, fontSize: "1.6rem", fontWeight: "900", fontFamily: "'JetBrains Mono', monospace", textShadow: `0 0 12px ${s.color}80` }}>
              {s.value}
            </div>
            <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.12em", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: "hsl(185,60%,50%)" }}>
          <div className="text-2xl mb-2">⟳</div>
          <div className="text-sm tracking-widest">LOADING HEALING LOGS...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded p-4"
              style={{
                background: "hsl(220,55%,7%)",
                border: "1px solid rgba(0,255,128,0.12)",
              }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  style={{
                    color: "hsl(185,100%,50%)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    background: "rgba(0,212,255,0.08)",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    border: "1px solid rgba(0,212,255,0.15)",
                  }}
                >
                  {log.errorCode}
                </span>
                <ComponentBadge component={log.component} />
                {log.patchShared && (
                  <span
                    className="px-2 py-0.5 rounded font-bold"
                    style={{
                      background: "rgba(0,255,128,0.1)",
                      color: "hsl(140,100%,50%)",
                      fontSize: "0.6rem",
                      border: "1px solid rgba(0,255,128,0.2)",
                    }}
                  >
                    PATCH SHARED
                  </span>
                )}
                <span className="ml-auto text-xs" style={{ color: "hsl(185,40%,35%)", fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="text-xs mb-2" style={{ color: "hsl(185,60%,65%)", fontSize: "0.75rem" }}>
                {log.description}
              </div>

              <div
                className="text-xs rounded p-2 mb-3"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  color: "hsl(140,80%,60%)",
                  fontSize: "0.65rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  border: "1px solid rgba(0,255,128,0.08)",
                }}
              >
                RESOLUTION: {log.resolution}
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>HEAL TIME: </span>
                  <HealTime ms={log.healTimeMs} />
                </div>
                <div>
                  <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>NODES PATCHED</div>
                  <div style={{ color: "hsl(185,100%,50%)", fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold", fontSize: "0.85rem" }}>
                    {log.nodesPatched.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
