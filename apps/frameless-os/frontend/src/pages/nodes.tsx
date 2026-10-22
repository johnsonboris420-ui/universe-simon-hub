import { useEffect, useState } from "react";

interface NetworkNode {
  id: number;
  nodeId: string;
  country: string;
  region: string;
  platform: string;
  status: string;
  patchesContributed: number;
  threatsShared: number;
  lastSeen: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  laptop: "⬜",
  desktop: "⬛",
  server: "⬡",
  vehicle: "◆",
  cloud: "◈",
};

const PLATFORM_COLORS: Record<string, string> = {
  laptop: "hsl(185,80%,55%)",
  desktop: "hsl(270,80%,65%)",
  server: "hsl(30,100%,55%)",
  vehicle: "hsl(140,80%,55%)",
  cloud: "hsl(185,100%,50%)",
};

function NodeStatus({ status }: { status: string }) {
  const cfg: Record<string, { color: string; glow: string }> = {
    online: { color: "hsl(140,100%,50%)", glow: "rgba(0,255,128,0.6)" },
    syncing: { color: "hsl(30,100%,55%)", glow: "rgba(255,140,0,0.6)" },
    offline: { color: "hsl(0,100%,55%)", glow: "rgba(255,0,64,0.6)" },
  };
  const c = cfg[status] || cfg.online;
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: c.color, boxShadow: `0 0 6px ${c.glow}`, display: "inline-block" }}
      />
      <span style={{ color: c.color, fontSize: "0.6rem", fontWeight: "bold", letterSpacing: "0.08em" }}>
        {status.toUpperCase()}
      </span>
    </span>
  );
}

export default function Nodes() {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/nodes")
      .then((r) => r.json())
      .then((d) => {
        setNodes(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? nodes : nodes.filter((n) => n.status === filter);
  const onlineCount = nodes.filter((n) => n.status === "online").length;
  const totalThreatsShared = nodes.reduce((sum, n) => sum + n.threatsShared, 0);
  const totalPatches = nodes.reduce((sum, n) => sum + n.patchesContributed, 0);
  const countries = [...new Set(nodes.map((n) => n.country))].length;

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
            ⬟ NETWORK NODES
          </div>
          <div className="text-xs mt-1" style={{ color: "hsl(185,40%,45%)", letterSpacing: "0.1em" }}>
            {onlineCount}/{nodes.length} online · {countries} countries · {totalThreatsShared.toLocaleString()} threats shared
          </div>
        </div>
        <div className="flex gap-1.5">
          {["all", "online", "syncing", "offline"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-2 py-1 rounded text-xs transition-colors"
              style={{
                background: filter === s ? "rgba(0,212,255,0.15)" : "transparent",
                color: filter === s ? "hsl(185,100%,50%)" : "hsl(185,40%,45%)",
                border: filter === s ? "1px solid rgba(0,212,255,0.3)" : "1px solid rgba(0,212,255,0.1)",
                fontSize: "0.6rem",
                letterSpacing: "0.08em",
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "ONLINE", value: onlineCount, color: "hsl(140,100%,50%)" },
          { label: "SYNCING", value: nodes.filter((n) => n.status === "syncing").length, color: "hsl(30,100%,55%)" },
          { label: "PATCHES SHARED", value: totalPatches.toLocaleString(), color: "hsl(185,100%,50%)" },
          { label: "COUNTRIES", value: countries, color: "hsl(270,100%,65%)" },
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
          <div className="text-sm tracking-widest">LOADING NETWORK...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((node) => (
            <div
              key={node.id}
              className="rounded p-4"
              style={{
                background: "hsl(220,55%,7%)",
                border: node.status === "online"
                  ? "1px solid rgba(0,212,255,0.15)"
                  : node.status === "offline"
                  ? "1px solid rgba(255,0,64,0.2)"
                  : "1px solid rgba(255,140,0,0.15)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "1.2rem", color: PLATFORM_COLORS[node.platform] }}>
                    {PLATFORM_ICONS[node.platform] || "▪"}
                  </span>
                  <div>
                    <div
                      className="font-bold text-sm"
                      style={{
                        color: "hsl(185,100%,80%)",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {node.nodeId}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "hsl(185,40%,50%)", fontSize: "0.65rem" }}>
                      {node.region}, {node.country}
                    </div>
                  </div>
                </div>
                <NodeStatus status={node.status} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "PLATFORM",
                    value: node.platform.toUpperCase(),
                    color: PLATFORM_COLORS[node.platform],
                  },
                  { label: "PATCHES", value: node.patchesContributed.toLocaleString(), color: "hsl(185,80%,65%)" },
                  { label: "THREATS SHARED", value: node.threatsShared.toLocaleString(), color: "hsl(185,80%,65%)" },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>{s.label}</div>
                    <div style={{ color: s.color || "hsl(185,80%,65%)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold" }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-xs" style={{ color: "hsl(185,30%,35%)", fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace" }}>
                LAST SEEN: {new Date(node.lastSeen).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
