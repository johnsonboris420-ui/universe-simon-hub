import { useEffect, useState } from "react";

interface ProtectionEvent {
  id: number;
  type: string;
  severity: string;
  description: string;
  outcome: string;
  caseId: string | null;
  authorityNotified: boolean;
  timestamp: string;
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    critical: { bg: "rgba(255,0,64,0.2)", color: "hsl(0,100%,60%)" },
    warning: { bg: "rgba(255,140,0,0.2)", color: "hsl(30,100%,60%)" },
    info: { bg: "rgba(0,212,255,0.15)", color: "hsl(185,100%,60%)" },
  };
  const c = cfg[severity] || cfg.info;
  return (
    <span
      className="px-2 py-0.5 rounded font-bold"
      style={{ background: c.bg, color: c.color, fontSize: "0.6rem", letterSpacing: "0.08em", border: `1px solid ${c.color}30` }}
    >
      {severity.toUpperCase()}
    </span>
  );
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  child_safety: { label: "CHILD SAFETY", color: "hsl(0,100%,55%)" },
  wellness_check: { label: "WELLNESS CHECK", color: "hsl(270,100%,65%)" },
  piracy_block: { label: "PIRACY BLOCK", color: "hsl(185,100%,50%)" },
  ai_isolation: { label: "AI ISOLATION", color: "hsl(30,100%,55%)" },
  hacker_report: { label: "HACKER REPORT", color: "hsl(0,80%,60%)" },
};

function EventTypeBadge({ type }: { type: string }) {
  const cfg = EVENT_TYPE_CONFIG[type] || { label: type.toUpperCase(), color: "hsl(185,80%,55%)" };
  return (
    <span
      className="px-2 py-0.5 rounded"
      style={{
        background: `${cfg.color}18`,
        color: cfg.color,
        fontSize: "0.6rem",
        letterSpacing: "0.06em",
        border: `1px solid ${cfg.color}30`,
      }}
    >
      {cfg.label}
    </span>
  );
}

export default function Protection() {
  const [events, setEvents] = useState<ProtectionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        setEvents(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);
  const authorityNotifiedCount = events.filter((e) => e.authorityNotified).length;
  const criticalCount = events.filter((e) => e.severity === "critical").length;
  const childSafetyCount = events.filter((e) => e.type === "child_safety").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div
            className="text-2xl font-black tracking-widest"
            style={{
              color: "hsl(270,100%,65%)",
              textShadow: "0 0 16px rgba(160,0,255,0.5)",
              letterSpacing: "0.2em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ⛨ CHILD PROTECTION
          </div>
          <div className="text-xs mt-1" style={{ color: "hsl(185,40%,45%)", letterSpacing: "0.1em" }}>
            Every child, everywhere — FRAMELESS AI Guard never sleeps
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "TOTAL EVENTS", value: events.length, color: "hsl(270,100%,65%)" },
          { label: "CRITICAL", value: criticalCount, color: "hsl(0,100%,55%)" },
          { label: "CHILD SAFETY", value: childSafetyCount, color: "hsl(0,80%,60%)" },
          { label: "AUTHORITY NOTIFIED", value: authorityNotifiedCount, color: "hsl(30,100%,55%)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded p-4 text-center"
            style={{ background: "hsl(220,55%,7%)", border: `1px solid ${s.color}25` }}
          >
            <div style={{ color: s.color, fontSize: "2rem", fontWeight: "900", fontFamily: "'JetBrains Mono', monospace", textShadow: `0 0 12px ${s.color}80` }}>
              {s.value}
            </div>
            <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.12em", marginTop: "4px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["all", "child_safety", "wellness_check", "piracy_block", "ai_isolation", "hacker_report"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-2 py-1 rounded text-xs transition-colors"
            style={{
              background: filter === t ? "rgba(160,0,255,0.15)" : "transparent",
              color: filter === t ? "hsl(270,80%,70%)" : "hsl(185,40%,45%)",
              border: filter === t ? "1px solid rgba(160,0,255,0.3)" : "1px solid rgba(0,212,255,0.1)",
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
            }}
          >
            {t === "all" ? "ALL" : EVENT_TYPE_CONFIG[t]?.label || t.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: "hsl(185,60%,50%)" }}>
          <div className="text-2xl mb-2">⟳</div>
          <div className="text-sm tracking-widest">LOADING PROTECTION EVENTS...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="rounded p-4"
              style={{
                background: "hsl(220,55%,7%)",
                border: event.severity === "critical"
                  ? "1px solid rgba(160,0,255,0.3)"
                  : event.severity === "warning"
                  ? "1px solid rgba(255,140,0,0.2)"
                  : "1px solid rgba(0,212,255,0.1)",
                boxShadow: event.severity === "critical" ? "0 0 16px rgba(160,0,255,0.08)" : "none",
              }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span style={{ color: "hsl(185,40%,35%)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem" }}>
                  #{event.id.toString().padStart(4, "0")}
                </span>
                <SeverityBadge severity={event.severity} />
                <EventTypeBadge type={event.type} />
                {event.caseId && (
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(255,140,0,0.1)",
                      color: "hsl(30,100%,55%)",
                      fontSize: "0.6rem",
                      border: "1px solid rgba(255,140,0,0.2)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {event.caseId}
                  </span>
                )}
                {event.authorityNotified && (
                  <span
                    className="px-2 py-0.5 rounded font-bold"
                    style={{
                      background: "rgba(255,0,64,0.15)",
                      color: "hsl(0,100%,60%)",
                      fontSize: "0.6rem",
                      border: "1px solid rgba(255,0,64,0.2)",
                    }}
                  >
                    ⚠ AUTHORITY NOTIFIED
                  </span>
                )}
                <span className="ml-auto text-xs" style={{ color: "hsl(185,40%,35%)", fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="text-xs mb-2" style={{ color: "hsl(185,60%,65%)", fontSize: "0.75rem" }}>
                {event.description}
              </div>

              <div
                className="text-xs rounded p-2"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  color: "hsl(140,80%,60%)",
                  fontSize: "0.65rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  border: "1px solid rgba(0,255,128,0.08)",
                }}
              >
                OUTCOME: {event.outcome}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: "hsl(185,40%,40%)" }}>
              <div className="text-3xl mb-3">⊘</div>
              <div className="text-sm tracking-widest">NO EVENTS MATCH CURRENT FILTER</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
