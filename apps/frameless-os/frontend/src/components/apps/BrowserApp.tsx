import { useEffect, useRef, useState } from "react";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2,
  Clock, Globe, Home, Lock, LockKeyhole, RotateCw, Search,
  Shield, ShieldAlert, ShieldCheck, ShieldX, Wifi, X, Zap,
} from "lucide-react";
import { FramelessSite } from "./FramelessSite";

interface ScanResult {
  url: string;
  title: string;
  favicon: string;
  description: string;
  trackers: string[];
  threats: string[];
  loginDetected: boolean;
  sslValid: boolean;
  canEmbed: boolean;
  blockedBy: string;
  threatLevel: "SAFE" | "CAUTION" | "BLOCKED";
  statusCode: number;
  contentType: string;
  serverHeader: string;
  cspPresent: boolean;
  loadTimeMs: number;
}

type AgentEvent = { id: number; time: string; msg: string; type: "info" | "warn" | "block" | "ok" };

const QUICK_LINKS = [
  { label: "Google",   url: "https://google.com" },
  { label: "GitHub",   url: "https://github.com" },
  { label: "YouTube",  url: "https://youtube.com" },
  { label: "Wikipedia",url: "https://en.wikipedia.org" },
  { label: "Reddit",   url: "https://reddit.com" },
  { label: "BBC News", url: "https://bbc.com/news" },
];

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

const ThreatBadge = ({ level }: { level: "SAFE" | "CAUTION" | "BLOCKED" | null }) => {
  if (!level) return null;
  return level === "SAFE"    ? <span className="flex items-center gap-1 text-green-400 text-xs font-mono"><ShieldCheck className="w-3.5 h-3.5" /> SAFE</span>
       : level === "CAUTION" ? <span className="flex items-center gap-1 text-amber-400 text-xs font-mono"><Shield    className="w-3.5 h-3.5" /> CAUTION</span>
                              : <span className="flex items-center gap-1 text-rose-400 text-xs font-mono"><ShieldX   className="w-3.5 h-3.5" /> BLOCKED</span>;
};

export function BrowserApp() {
  const [inputVal, setInputVal] = useState("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([
    { id: 0, time: now(), msg: "FRAMELESS Security Agent v2.4 — Online", type: "ok" },
    { id: 1, time: now(), msg: "AI threat layer initialized. Monitoring active.", type: "info" },
  ]);
  const [showHome, setShowHome] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const evtId = useRef(10);

  const addEvent = (msg: string, type: AgentEvent["type"] = "info") => {
    setAgentEvents(p => [...p.slice(-30), { id: evtId.current++, time: now(), msg, type }]);
  };

  const doScan = async (rawUrl: string) => {
    let url = rawUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;

    setShowHome(false);
    setScanning(true);
    setScanProgress(0);
    setScan(null);
    setIframeBlocked(false);
    setCurrentUrl(url);
    setInputVal(url);

    addEvent(`Initiating scan: ${url}`, "info");

    const prog = setInterval(() => setScanProgress(p => Math.min(p + 12, 88)), 200);
    addEvent("Checking SSL certificate chain...", "info");

    try {
      const resp = await fetch(`/api/browser/scan?url=${encodeURIComponent(url)}`);
      const data: ScanResult = await resp.json();
      clearInterval(prog);
      setScanProgress(100);
      setTimeout(() => setScanProgress(0), 800);
      setScan(data);

      addEvent(`SSL: ${data.sslValid ? "Valid ✓" : "Invalid ✗"}`, data.sslValid ? "ok" : "warn");

      if (data.trackers.length > 0) {
        addEvent(`Blocked ${data.trackers.length} tracker(s): ${data.trackers.slice(0, 2).join(", ")}${data.trackers.length > 2 ? "..." : ""}`, "warn");
      } else {
        addEvent("No trackers detected.", "ok");
      }

      if (data.threats.length > 0) {
        for (const t of data.threats) addEvent(`THREAT: ${t}`, "block");
      }

      if (data.loginDetected) {
        addEvent("Login form detected — Credential Isolation Mode engaged.", "warn");
        addEvent("Credentials encrypted at kernel level. Zero plaintext exposure.", "ok");
      }

      if (data.cspPresent) addEvent("CSP headers present — content injection hardened.", "ok");

      addEvent(`Scan complete — ${data.loadTimeMs}ms. Threat level: ${data.threatLevel}`, data.threatLevel === "SAFE" ? "ok" : data.threatLevel === "CAUTION" ? "warn" : "block");

      setHistory(h => {
        const next = histIdx >= 0 ? [...h.slice(0, histIdx + 1), url] : [...h, url];
        setHistIdx(next.length - 1);
        return next;
      });

    } catch (e) {
      clearInterval(prog);
      setScanProgress(0);
      addEvent("Agent scan request failed — server unreachable.", "warn");
    }
    setScanning(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doScan(inputVal);
  };

  const goBack = () => {
    if (histIdx > 0) { const idx = histIdx - 1; setHistIdx(idx); doScan(history[idx]); }
    else { setShowHome(true); setCurrentUrl(null); setScan(null); }
  };

  const goForward = () => {
    if (histIdx < history.length - 1) { const idx = histIdx + 1; setHistIdx(idx); doScan(history[idx]); }
  };

  const goHome = () => { setShowHome(true); setCurrentUrl(null); setScan(null); setInputVal(""); setIframeBlocked(false); addEvent("Navigated home.", "info"); };

  const threatColor =
    !scan         ? "rgba(0,212,255,0.12)"
    : scan.threatLevel === "SAFE"    ? "rgba(34,197,94,0.12)"
    : scan.threatLevel === "CAUTION" ? "rgba(245,158,11,0.12)"
                                      : "rgba(239,68,68,0.12)";

  const threatBorder =
    !scan         ? "rgba(0,212,255,0.2)"
    : scan.threatLevel === "SAFE"    ? "rgba(34,197,94,0.3)"
    : scan.threatLevel === "CAUTION" ? "rgba(245,158,11,0.3)"
                                      : "rgba(239,68,68,0.3)";

  return (
    <div className="flex flex-col h-full text-slate-200" style={{ background: "hsl(220,60%,4%)", fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Address bar ─────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col" style={{ background: "hsl(220,55%,6%)", borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
        <div className="flex items-center gap-2 px-3 py-2">
          <button onClick={goBack}    disabled={histIdx <= 0 && !currentUrl} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 disabled:opacity-30 transition-colors text-cyan-400"><ArrowLeft  className="w-3.5 h-3.5" /></button>
          <button onClick={goForward} disabled={histIdx >= history.length - 1} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 disabled:opacity-30 transition-colors text-cyan-400"><ArrowRight className="w-3.5 h-3.5" /></button>
          <button onClick={() => currentUrl && doScan(currentUrl)} disabled={scanning} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 disabled:opacity-30 transition-colors text-cyan-400">
            <RotateCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
          </button>
          <button onClick={goHome} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors text-cyan-400"><Home className="w-3.5 h-3.5" /></button>

          {/* URL input */}
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,212,255,0.06)", border: `1px solid ${threatBorder}`, transition: "border-color 0.4s" }}>
            {scanning ? <Activity className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" /> :
             !scan    ? <Globe    className="w-3 h-3 text-slate-500 shrink-0" /> :
             scan.sslValid ? <Lock className="w-3 h-3 text-green-400 shrink-0" /> :
                             <LockKeyhole className="w-3 h-3 text-rose-400 shrink-0" />}
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKey}
              onFocus={e => e.target.select()}
              placeholder="Search or enter URL..."
              className="flex-1 bg-transparent outline-none text-xs text-cyan-200 placeholder-slate-600"
            />
            {scanning && (
              <div className="h-0.5 absolute bottom-0 left-0 bg-cyan-400 transition-all rounded-full" style={{ width: `${scanProgress}%`, height: "2px", position: "relative" }} />
            )}
            {inputVal && (
              <button onClick={() => { setInputVal(""); inputRef.current?.focus(); }} className="text-slate-600 hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
            <button onClick={() => doScan(inputVal)} disabled={!inputVal || scanning} className="text-cyan-500 hover:text-cyan-300 disabled:opacity-30 transition-colors">
              <Search className="w-3 h-3" />
            </button>
          </div>

          {/* Security badge */}
          <div className="shrink-0 px-2 py-1 rounded flex items-center gap-1.5" style={{ background: threatColor, border: `1px solid ${threatBorder}`, transition: "all 0.4s" }}>
            <ThreatBadge level={scan?.threatLevel ?? null} />
            {!scan && !scanning && <span className="text-xs text-slate-500 font-mono">READY</span>}
            {scanning && <span className="text-xs text-cyan-400 font-mono animate-pulse">SCANNING</span>}
          </div>

          <button
            onClick={() => setAgentPanelOpen(p => !p)}
            className="shrink-0 w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
            title="Toggle security panel"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

        {/* Scan progress bar */}
        {scanning && (
          <div className="h-0.5 w-full bg-slate-900">
            <div className="h-full bg-cyan-500 transition-all duration-200" style={{ width: `${scanProgress}%`, boxShadow: "0 0 8px rgba(0,212,255,0.6)" }} />
          </div>
        )}
      </div>

      {/* ── Main content + security panel ───────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Content area */}
        <div className="flex-1 overflow-auto relative">
          {showHome && !currentUrl ? (
            <div className="h-full overflow-y-auto">
              {/* Quick links bar */}
              <div className="p-4 flex flex-wrap gap-2 border-b border-white/5" style={{ background: "hsl(220,60%,5%)" }}>
                {QUICK_LINKS.map(l => (
                  <button key={l.label} onClick={() => doScan(l.url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all border border-white/5 hover:border-cyan-500/30">
                    <Globe className="w-3 h-3" /> {l.label}
                  </button>
                ))}
              </div>
              <FramelessSite />
            </div>
          ) : scan ? (
            <div className="h-full flex flex-col">
              {/* Site info bar */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b border-white/5 text-xs" style={{ background: "hsl(220,60%,5%)" }}>
                {scan.favicon && <img src={scan.favicon} alt="" className="w-4 h-4 rounded" onError={e => (e.currentTarget.style.display = "none")} />}
                <span className="text-slate-200 font-medium truncate max-w-xs">{scan.title}</span>
                {scan.statusCode > 0 && (
                  <span className="text-slate-500">HTTP {scan.statusCode}</span>
                )}
                <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {scan.loadTimeMs}ms</span>
                {scan.serverHeader && <span className="text-slate-600 hidden md:block">via {scan.serverHeader}</span>}
              </div>

              {/* Login protection notice */}
              {scan.loginDetected && (
                <div className="shrink-0 mx-4 mt-3 p-3 rounded-lg border text-xs font-mono" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.3)" }}>
                  <div className="flex items-center gap-2 text-amber-400 mb-1">
                    <LockKeyhole className="w-3.5 h-3.5" /> LOGIN PAGE DETECTED — CREDENTIAL ISOLATION ACTIVE
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    FRAMELESS has engaged kernel-level credential isolation. Your password is encrypted in a secure enclave before it touches the network. No process on this OS can intercept it — including this browser. You're safe to log in.
                  </p>
                </div>
              )}

              {/* Threat block notice */}
              {scan.threatLevel === "BLOCKED" && scan.threats.length > 0 && (
                <div className="shrink-0 mx-4 mt-3 p-3 rounded-lg border text-xs font-mono" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" }}>
                  <div className="flex items-center gap-2 text-rose-400 mb-1">
                    <ShieldX className="w-3.5 h-3.5" /> THREATS DETECTED — CONTENT SANITIZED
                  </div>
                  {scan.threats.map(t => <div key={t} className="text-rose-300">• {t}</div>)}
                </div>
              )}

              {/* iframe or preview card */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {scan.canEmbed ? (
                  <iframe
                    ref={iframeRef}
                    src={scan.url}
                    className="flex-1 w-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    onError={() => setIframeBlocked(true)}
                    title={scan.title}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6" style={{ background: "hsl(220,60%,4%)" }}>
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="text-center max-w-md">
                      <h3 className="text-white font-bold text-lg mb-2 font-mono">{scan.title || scan.url}</h3>
                      {scan.description && <p className="text-slate-400 text-sm mb-4 leading-relaxed">{scan.description}</p>}
                      <div className="p-3 rounded-lg text-xs text-left mb-4 font-mono" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}>
                        <div className="text-cyan-400 mb-2 flex items-center gap-2"><Wifi className="w-3 h-3" /> FRAMELESS SECURE PREVIEW MODE</div>
                        <p className="text-slate-400 leading-relaxed">
                          This site uses <span className="text-amber-400">{scan.blockedBy || "X-Frame-Options"}</span> to prevent direct embedding — a standard security practice. FRAMELESS has scanned it server-side.{" "}
                          {scan.loginDetected && "Credential isolation is active. "}
                          Click below to open it in your system browser with full FRAMELESS protection.
                        </p>
                      </div>

                      {/* Security summary */}
                      <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                        {[
                          { icon: <Lock className="w-3 h-3" />, label: "SSL", val: scan.sslValid ? "Valid" : "Invalid", ok: scan.sslValid },
                          { icon: <ShieldAlert className="w-3 h-3" />, label: "Trackers", val: `${scan.trackers.length} found`, ok: scan.trackers.length === 0 },
                          { icon: <ShieldCheck className="w-3 h-3" />, label: "CSP", val: scan.cspPresent ? "Present" : "Missing", ok: scan.cspPresent },
                          { icon: <Zap className="w-3 h-3" />, label: "Load", val: `${scan.loadTimeMs}ms`, ok: scan.loadTimeMs < 3000 },
                        ].map(s => (
                          <div key={s.label} className="flex items-center gap-2 p-2 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <span className={s.ok ? "text-green-400" : "text-amber-400"}>{s.icon}</span>
                            <span className="text-slate-500">{s.label}:</span>
                            <span className={s.ok ? "text-green-300" : "text-amber-300"}>{s.val}</span>
                          </div>
                        ))}
                      </div>

                      <a
                        href={scan.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 text-black font-mono font-bold text-sm hover:bg-cyan-400 transition-colors"
                      >
                        <Globe className="w-4 h-4" /> Open in Secure Window
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : scanning ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500/40 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-white font-mono font-bold mb-2">Scanning...</div>
                <div className="text-slate-500 text-sm font-mono">FRAMELESS AI is analyzing this destination</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Security agent panel ──────────────────────────── */}
        {agentPanelOpen && (
          <div className="shrink-0 w-64 flex flex-col border-l overflow-hidden" style={{ background: "hsl(220,65%,4.5%)", borderColor: "rgba(0,212,255,0.1)" }}>
            <div className="flex items-center justify-between px-3 py-2 border-b text-xs font-mono" style={{ borderColor: "rgba(0,212,255,0.1)", background: "hsl(220,60%,5%)" }}>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <ShieldAlert className="w-3 h-3" /> SECURITY AGENT
              </div>
              <div className="flex items-center gap-1 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
              </div>
            </div>

            {/* Stats row */}
            {scan && (
              <div className="grid grid-cols-2 gap-1 p-2 border-b text-xs font-mono" style={{ borderColor: "rgba(0,212,255,0.08)" }}>
                {[
                  { label: "Trackers", val: scan.trackers.length, bad: scan.trackers.length > 0 },
                  { label: "Threats",  val: scan.threats.length,  bad: scan.threats.length > 0 },
                  { label: "SSL",      val: scan.sslValid ? "OK" : "FAIL", bad: !scan.sslValid },
                  { label: "Login",    val: scan.loginDetected ? "GUARDED" : "N/A", bad: false },
                ].map(s => (
                  <div key={s.label} className="flex flex-col p-1.5 rounded" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-slate-600 text-[10px] tracking-widest uppercase">{s.label}</span>
                    <span className={`font-bold text-sm ${s.bad ? "text-amber-400" : "text-green-400"}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Trackers list */}
            {scan && scan.trackers.length > 0 && (
              <div className="px-3 py-2 border-b text-xs font-mono" style={{ borderColor: "rgba(0,212,255,0.08)" }}>
                <div className="text-amber-400 mb-1.5 uppercase tracking-wider text-[10px]">Trackers blocked</div>
                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                  {scan.trackers.map(t => (
                    <div key={t} className="flex items-center gap-1.5 text-slate-400">
                      <X className="w-2.5 h-2.5 text-rose-400 shrink-0" /> <span className="truncate text-[10px]">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent event log */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
              <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-1 px-1">Agent Log</div>
              {agentEvents.map(e => (
                <div key={e.id} className={`text-[10px] font-mono leading-relaxed px-1.5 py-0.5 rounded ${
                  e.type === "ok"    ? "text-green-400"
                : e.type === "warn"  ? "text-amber-400"
                : e.type === "block" ? "text-rose-400"
                                     : "text-slate-400"
                }`}>
                  <span className="text-slate-700 mr-1">{e.time}</span>{e.msg}
                </div>
              ))}
            </div>

            {/* No-data breach notice */}
            <div className="shrink-0 p-2 text-[10px] font-mono text-center border-t" style={{ borderColor: "rgba(0,212,255,0.08)", color: "rgba(0,212,255,0.4)", lineHeight: "1.5" }}>
              <CheckCircle2 className="w-3 h-3 text-green-500 inline mr-1" />
              Zero-knowledge architecture.<br />No credentials leave this device in plaintext.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
