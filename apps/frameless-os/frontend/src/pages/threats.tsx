import { useEffect, useState } from "react";

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

const SEVERITIES = ["all", "critical", "high", "medium", "low"];
const CATEGORIES = ["all", "hacker", "malware", "exploit", "child_safety", "piracy", "suspicious", "ai_rogue"];
const STATUSES = ["all", "blocked", "reported", "resolved", "detected"];

function SeverityBadge({ severity }: { severity: string }) {
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

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    hacker: "hsl(30,100%,55%)",
    malware: "hsl(0,100%,55%)",
    exploit: "hsl(0,80%,60%)",
    child_safety: "hsl(270,100%,65%)",
    piracy: "hsl(185,80%,55%)",
    suspicious: "hsl(50,100%,55%)",
    ai_rogue: "hsl(300,100%,60%)",
  };
  const color = colors[category] || "hsl(185,60%,55%)";
  return (
    <span
      className="px-2 py-0.5 rounded whitespace-nowrap"
      style={{
        background: `${color}18`,
        color,
        fontSize: "0.6rem",
        letterSpacing: "0.06em",
        border: `1px solid ${color}30`,
      }}
    >
      {category.replace("_", " ").toUpperCase()}
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
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      <span style={{ color, fontSize: "0.65rem", fontWeight: "bold" }}>{status.toUpperCase()}</span>
    </span>
  );
}

export default function Threats() {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (severity !== "all") params.set("severity", severity);
    if (category !== "all") params.set("category", category);
    if (status !== "all") params.set("status", status);
    params.set("limit", "100");

    fetch(`/api/threats?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setThreats(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [severity, category, status]);

  const FilterSelect = ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: "hsl(185,40%,45%)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded px-2 py-1 text-xs outline-none"
        style={{
          background: "hsl(220,55%,9%)",
          border: "1px solid rgba(0,212,255,0.2)",
          color: "hsl(185,80%,65%)",
          fontSize: "0.65rem",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-2xl font-black tracking-widest"
            style={{
              color: "hsl(0,100%,55%)",
              textShadow: "0 0 16px rgba(255,0,64,0.5)",
              letterSpacing: "0.2em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ⚠ THREAT FEED
          </div>
          <div className="text-xs mt-1" style={{ color: "hsl(185,40%,45%)", letterSpacing: "0.1em" }}>
            {threats.length} threats detected — Real-time intelligence
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(0,100%,55%)", boxShadow: "0 0 6px rgba(255,0,64,0.7)" }} />
          <span className="text-xs" style={{ color: "hsl(0,80%,55%)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>LIVE</span>
        </div>
      </div>

      <div
        className="rounded p-3 flex flex-wrap gap-4"
        style={{ background: "hsl(220,55%,7%)", border: "1px solid rgba(0,212,255,0.12)" }}
      >
        <FilterSelect label="SEVERITY" value={severity} options={SEVERITIES} onChange={setSeverity} />
        <FilterSelect label="CATEGORY" value={category} options={CATEGORIES} onChange={setCategory} />
        <FilterSelect label="STATUS" value={status} options={STATUSES} onChange={setStatus} />
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: "hsl(185,60%,50%)" }}>
          <div className="text-2xl mb-2">⟳</div>
          <div className="text-sm tracking-widest">LOADING THREATS...</div>
        </div>
      ) : (
        <div className="space-y-2">
          {threats.map((threat) => (
            <div
              key={threat.id}
              className="rounded p-4"
              style={{
                background: "hsl(220,55%,7%)",
                border: threat.severity === "critical"
                  ? "1px solid rgba(255,0,64,0.3)"
                  : "1px solid rgba(0,212,255,0.1)",
                boxShadow: threat.severity === "critical"
                  ? "0 0 12px rgba(255,0,64,0.1)"
                  : "none",
              }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-xs font-bold"
                  style={{
                    color: "hsl(185,40%,40%)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                    minWidth: "24px",
                  }}
                >
                  #{threat.id.toString().padStart(4, "0")}
                </span>
                <SeverityBadge severity={threat.severity} />
                <CategoryBadge category={threat.category} />
                <StatusDot status={threat.status} />
                {threat.caseId && (
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(0,212,255,0.08)",
                      color: "hsl(185,80%,60%)",
                      fontSize: "0.6rem",
                      border: "1px solid rgba(0,212,255,0.2)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {threat.caseId}
                  </span>
                )}
                {threat.reportedToAuthorities && (
                  <span
                    className="px-2 py-0.5 rounded font-bold"
                    style={{
                      background: "rgba(255,140,0,0.15)",
                      color: "hsl(30,100%,55%)",
                      fontSize: "0.6rem",
                      border: "1px solid rgba(255,140,0,0.3)",
                    }}
                  >
                    REPORTED TO LEA
                  </span>
                )}
                <span className="ml-auto text-xs" style={{ color: "hsl(185,40%,40%)", fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {new Date(threat.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs" style={{ color: "hsl(185,60%,65%)", fontSize: "0.75rem" }}>
                  {threat.description}
                </span>
                <span
                  className="ml-auto text-xs whitespace-nowrap"
                  style={{
                    color: "hsl(185,40%,40%)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.6rem",
                  }}
                >
                  {threat.sourceIp}
                </span>
              </div>
            </div>
          ))}
          {threats.length === 0 && (
            <div className="text-center py-12" style={{ color: "hsl(185,40%,40%)" }}>
              <div className="text-3xl mb-3">⊘</div>
              <div className="text-sm tracking-widest">NO THREATS MATCH CURRENT FILTERS</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
