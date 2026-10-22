import { useEffect, useState } from "react";

interface Platform {
  id: number;
  type: string;
  name: string;
  activeNodes: number;
  threatsBlocked: number;
  status: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  laptop: "⬜",
  desktop: "⬛",
  server: "⬡",
  vehicle: "◆",
  cloud: "◈",
  mobile: "▭",
};

const PLATFORM_COLORS: Record<string, string> = {
  laptop: "hsl(185,100%,50%)",
  desktop: "hsl(270,80%,65%)",
  server: "hsl(30,100%,55%)",
  vehicle: "hsl(140,80%,55%)",
  cloud: "hsl(185,80%,60%)",
  mobile: "hsl(300,80%,65%)",
};

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    active: { bg: "rgba(0,255,128,0.15)", color: "hsl(140,100%,50%)" },
    maintenance: { bg: "rgba(255,140,0,0.15)", color: "hsl(30,100%,55%)" },
    offline: { bg: "rgba(255,0,64,0.15)", color: "hsl(0,100%,55%)" },
  };
  const c = cfg[status] || cfg.active;
  return (
    <span
      className="px-2 py-0.5 rounded font-bold"
      style={{ background: c.bg, color: c.color, fontSize: "0.6rem", letterSpacing: "0.08em", border: `1px solid ${c.color}30` }}
    >
      {status.toUpperCase()}
    </span>
  );
}

export default function Platforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platforms")
      .then((r) => r.json())
      .then((d) => {
        setPlatforms(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalNodes = platforms.reduce((sum, p) => sum + p.activeNodes, 0);
  const totalThreats = platforms.reduce((sum, p) => sum + p.threatsBlocked, 0);
  const activeCount = platforms.filter((p) => p.status === "active").length;

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
            ▣ PLATFORM COVERAGE
          </div>
          <div className="text-xs mt-1" style={{ color: "hsl(185,40%,45%)", letterSpacing: "0.1em" }}>
            {platforms.length} platform types · {totalNodes.toLocaleString()} active nodes · {totalThreats.toLocaleString()} threats blocked
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "PLATFORM TYPES", value: platforms.length, color: "hsl(185,100%,50%)" },
          { label: "ACTIVE NODES", value: totalNodes.toLocaleString(), color: "hsl(140,100%,50%)" },
          { label: "THREATS BLOCKED", value: totalThreats.toLocaleString(), color: "hsl(0,100%,55%)" },
          { label: "ACTIVE", value: activeCount, color: "hsl(140,100%,50%)" },
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
          <div className="text-sm tracking-widest">LOADING PLATFORMS...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const color = PLATFORM_COLORS[platform.type] || "hsl(185,100%,50%)";
            const maxNodes = Math.max(...platforms.map((p) => p.activeNodes), 1);
            const maxThreats = Math.max(...platforms.map((p) => p.threatsBlocked), 1);
            return (
              <div
                key={platform.id}
                className="rounded p-5"
                style={{
                  background: "hsl(220,55%,7%)",
                  border: `1px solid ${color}20`,
                  boxShadow: `0 0 16px ${color}08`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: "1.6rem", color }}>{PLATFORM_ICONS[platform.type] || "▪"}</span>
                    <div>
                      <div
                        className="font-black text-base"
                        style={{
                          color: "hsl(185,100%,85%)",
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {platform.name}
                      </div>
                      <div style={{ color, fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: "bold" }}>
                        {platform.type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={platform.status} />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>ACTIVE NODES</span>
                      <span style={{ color, fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold" }}>
                        {platform.activeNodes.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(platform.activeNodes / maxNodes) * 100}%`,
                          background: color,
                          boxShadow: `0 0 4px ${color}`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>THREATS BLOCKED</span>
                      <span style={{ color: "hsl(0,100%,55%)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold" }}>
                        {platform.threatsBlocked.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(platform.threatsBlocked / maxThreats) * 100}%`,
                          background: "hsl(0,100%,55%)",
                          boxShadow: "0 0 4px rgba(255,0,64,0.6)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
