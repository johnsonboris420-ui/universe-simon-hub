import React, { useEffect, useRef, useState } from "react";
import {
  Activity, ActivitySquare, AlertTriangle, CheckCircle2,
  Fingerprint, Heart, Layers, Lock, Network, Radio,
  ShieldAlert, ShieldCheck, Terminal, X,
} from "lucide-react";

function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);
  return [ref, isIntersecting] as const;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, visible] = useIntersectionObserver();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 transform ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function DownloadModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [use, setUse] = useState("personal");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#050a14,#020610)", border: "1px solid rgba(6,182,212,0.3)", boxShadow: "0 0 80px rgba(6,182,212,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)] flex items-center justify-center">
              <Layers className="w-4 h-4 text-black" />
            </div>
            <span className="font-mono font-bold tracking-[0.15em] text-sm text-white">FRAMELESS OS</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-widest mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> BETA ACCESS — LIMITED SLOTS
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-mono">Request Early Access</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  FRAMELESS v2.4.1 is in controlled beta. Join the waitlist and our team will reach out within 24 hours.
                </p>
              </div>
              <form onSubmit={e => { e.preventDefault(); if (email && name) setSubmitted(true); }} className="space-y-4">
                {[
                  { label: "Full Name", val: name, set: setName, type: "text", ph: "Ada Lovelace" },
                  { label: "Email Address", val: email, set: setEmail, type: "email", ph: "ada@company.com" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-mono text-slate-500 tracking-widest uppercase mb-1.5">{f.label}</label>
                    <input
                      type={f.type} value={f.val} required onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/50 transition-colors font-mono"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-mono text-slate-500 tracking-widest uppercase mb-1.5">Intended Use</label>
                  <select value={use} onChange={e => setUse(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-cyan-500/50 transition-colors font-mono" style={{ color: "white" }}>
                    {["personal|Personal / Home", "enterprise|Enterprise", "government|Government / Defense", "research|Research / Academic", "automotive|Automotive / EV"].map(o => {
                      const [val, label] = o.split("|");
                      return <option key={val} value={val} style={{ background: "#050a14" }}>{label}</option>;
                    })}
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold tracking-widest text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  REQUEST BETA ACCESS →
                </button>
                <p className="text-center text-xs text-white/20 font-mono">No spam. Quantum-encrypted.</p>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-mono">You're on the list.</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                We'll reach out to <span className="text-cyan-400 font-mono">{email}</span> within 24 hours.
              </p>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 text-left mb-4">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">What's included</div>
                {["Full FRAMELESS OS installer (x86_64 + ARM)", "AI Guardian activation key", "60-day unlimited beta license", "Direct line to the engineering team"].map(i => (
                  <div key={i} className="flex items-center gap-2 py-1 text-xs text-slate-300 font-mono"><span className="text-green-400">✓</span> {i}</div>
                ))}
              </div>
              <button onClick={onClose} className="px-6 py-2.5 border border-white/10 hover:bg-white/5 text-white font-mono text-sm rounded-lg transition-colors tracking-widest">CLOSE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InvestorModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firm, setFirm] = useState("");
  const [stage, setStage] = useState("series-a");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#050a14,#020610)", border: "1px solid rgba(6,182,212,0.3)", boxShadow: "0 0 80px rgba(6,182,212,0.12)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <div className="font-mono font-bold tracking-[0.15em] text-sm text-white">INVESTOR RELATIONS</div>
            <div className="text-xs text-cyan-500/60 font-mono tracking-widest">FRAMELESS SYSTEMS CORP — SERIES A</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">
          {!submitted ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[{ val: "$2.8B", label: "2026 TAM" }, { val: "$25M", label: "Round Size" }, { val: "67%", label: "YoY Growth" }].map(s => (
                  <div key={s.label} className="text-center p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="text-lg font-black text-cyan-400 font-mono" style={{ textShadow: "0 0 10px rgba(6,182,212,0.4)" }}>{s.val}</div>
                    <div className="text-xs text-slate-500 font-mono tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); if (name && email) setSubmitted(true); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Full Name *", val: name, set: setName, type: "text", ph: "Jane Smith" }, { label: "Email *", val: email, set: setEmail, type: "email", ph: "jane@vc.com" }].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-mono text-slate-500 tracking-widest uppercase mb-1.5">{f.label}</label>
                      <input type={f.type} value={f.val} required onChange={e => f.set(e.target.value)} placeholder={f.ph}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/50 transition-colors font-mono" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 tracking-widest uppercase mb-1.5">Firm / Fund</label>
                    <input type="text" value={firm} onChange={e => setFirm(e.target.value)} placeholder="Sequoia, a16z…"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/50 transition-colors font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 tracking-widest uppercase mb-1.5">Stage</label>
                    <select value={stage} onChange={e => setStage(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50 transition-colors font-mono" style={{ color: "white" }}>
                      {["angel|Angel / Pre-Seed", "seed|Seed", "series-a|Series A", "series-b+|Series B+", "strategic|Strategic / Corporate"].map(o => {
                        const [val, label] = o.split("|");
                        return <option key={val} value={val} style={{ background: "#050a14" }}>{label}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 tracking-widest uppercase mb-1.5">Message (optional)</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Your investment thesis or questions…"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/50 transition-colors font-mono resize-none" />
                </div>
                <button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold tracking-widest text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  REQUEST INVESTOR DECK + DATA ROOM →
                </button>
                <p className="text-center text-xs text-white/20 font-mono">All qualified inquiries answered within 48 hours.</p>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-mono">Inquiry Received.</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                Thank you, <span className="text-cyan-400 font-mono">{name}</span>. We'll contact <span className="text-cyan-400 font-mono">{email}</span> within 48 hours with data room access and a live demo booking link.
              </p>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5 text-left mb-5">
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">You'll receive</div>
                {["Full investor deck (Series A)", "Audited technical architecture", "Live data room access", "One-on-one demo call booking link"].map(i => (
                  <div key={i} className="flex items-center gap-2 py-1 text-xs text-slate-300 font-mono"><span className="text-cyan-400">→</span> {i}</div>
                ))}
              </div>
              <div className="text-xs text-slate-500 font-mono mb-4">Direct: <span className="text-cyan-400">invest@frameless.os</span></div>
              <button onClick={onClose} className="px-6 py-2.5 border border-white/10 hover:bg-white/5 text-white font-mono text-sm rounded-lg transition-colors tracking-widest">CLOSE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FramelessSite() {
  const [modal, setModal] = useState<"download" | "investor" | null>(null);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);
  const [activeNodes, setActiveNodes] = useState(84291);
  const [agents, setAgents] = useState([
    { id: "SYS_CORE_OP",     status: "SAFE"    },
    { id: "NET_ROUTER_7",    status: "SAFE"    },
    { id: "EXT_DATA_FETCH",  status: "SAFE"    },
    { id: "USER_ASSIST_AI",  status: "SAFE"    },
    { id: "PROC_MEM_ALLOC",  status: "WARNING" },
  ]);
  const [threatFeed, setThreatFeed] = useState<string[]>(["[SYSTEM] Threat monitor initialized"]);

  useEffect(() => {
    const t = setInterval(() => setActiveNodes(n => n + Math.floor(Math.random() * 5)), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!bootComplete) return;
    const t1 = setTimeout(() => setAgents(p => p.map(a => a.id === "PROC_MEM_ALLOC" ? { ...a, status: "ISOLATED" } : a)), 4000);
    const t2 = setTimeout(() => setAgents(p => p.map(a => a.id === "USER_ASSIST_AI" ? { ...a, status: "WARNING" } : a)), 8000);
    const t3 = setTimeout(() => setAgents(p => p.map(a => a.id === "USER_ASSIST_AI" ? { ...a, status: "ISOLATED" } : a)), 11000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [bootComplete]);

  useEffect(() => {
    const logs = [
      "[BLOCKED] Unauthorized root access attempt — 192.168.1.44",
      "[FLAGGED] Known exploit signature detected — Session frozen",
      "[REPORTED] Evidence package sent to authorities — Case #FR-2026-04891",
      "[BLOCKED] Pirated binary execution denied — License mismatch",
      "[ISOLATED] Rogue AI process terminated — Ethical bounds exceeded",
      "[DEFENDED] Zero-day buffer overflow attempt mitigated",
      "[SYNC] Global threat database updated — 1,204 new signatures",
    ];
    let i = 0;
    const t = setInterval(() => { setThreatFeed(p => [...p.slice(-6), logs[i % logs.length]]); i++; }, 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const bootLines = [
      "BIOS Date 04/28/26 14:02:11 Ver 09.00.04",
      "CPU: Quantum Neuro-Core i9 @ 5.40GHz",
      "Memory Test: 65536MB OK",
      "Initializing Hardware Abstraction Layer... OK",
      "Loading AI Core... OK",
      "Loading Ethical Bounds Module... VERIFIED",
      "Initializing Threat Scanner... ACTIVE",
      "Establishing Global Mesh Connection... SECURE",
      "Boot sequence complete.",
    ];
    let i = 0;
    const t = setInterval(() => {
      if (i < bootLines.length) { setBootSequence(p => [...p, bootLines[i]]); i++; }
      else { clearInterval(t); setTimeout(() => setBootComplete(true), 500); }
    }, 200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-full bg-[#030712] text-slate-200 font-sans overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {modal === "download"  && <DownloadModal  onClose={() => setModal(null)} />}
      {modal === "investor"  && <InvestorModal  onClose={() => setModal(null)} />}

      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.02] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* Nav */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-[#030712]/60 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center justify-center">
            <Layers className="w-5 h-5 text-black" />
          </div>
          <span className="font-mono font-bold tracking-[0.2em] text-sm text-white">FRAMELESS</span>
        </div>
        <button
          onClick={() => setModal("investor")}
          className="px-5 py-2 text-xs font-mono font-bold tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all rounded hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          REQUEST INVESTOR ACCESS
        </button>
      </nav>

      {/* Hero — BIOS Boot */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden bg-black">
        <div className="absolute inset-0 z-0 opacity-40">
          <img src="/images/frameless-bios.png" alt="" className="w-full h-full object-cover object-center filter grayscale contrast-125 opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/90 to-[#030712]" />
        </div>
        <div className="w-full max-w-4xl relative z-10 mx-auto flex flex-col items-center text-center">
          {!bootComplete ? (
            <div className="w-full max-w-2xl bg-black/80 border border-white/10 p-6 rounded-lg font-mono text-sm text-green-500 text-left min-h-[300px] shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-sm flex flex-col">
              {bootSequence.map((line, i) => (
                <div key={i} className="mb-1" style={{ animation: "frameless-fade-in 0.3s ease-out forwards" }}>
                  <span className="opacity-50 mr-2">{">"}</span> {line}
                </div>
              ))}
              <div className="mt-2 w-2 h-4 bg-green-500 animate-pulse" />
            </div>
          ) : (
            <div className="w-full flex flex-col items-center" style={{ animation: "frameless-fade-in 0.5s ease-out forwards" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-xs font-mono tracking-widest mb-8 uppercase backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]" />
                System Online
              </div>
              <h1 className="text-7xl font-mono font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] leading-none">
                FRAMELESS
              </h1>
              <p className="text-xl text-cyan-100/70 font-mono tracking-tight mb-12 max-w-2xl">
                The OS that{" "}
                <span className="text-cyan-400 font-semibold">thinks.</span>{" "}
                <span className="text-amber-400 font-semibold">Protects.</span>{" "}
                <span className="text-white font-semibold">Evolves.</span>
              </p>
              <div className="flex gap-4 flex-wrap justify-center">
                <button
                  onClick={() => setModal("download")}
                  className="px-8 py-4 bg-cyan-500 text-black font-mono font-bold tracking-widest text-sm hover:bg-cyan-400 transition-colors rounded shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                >
                  DOWNLOAD BETA
                </button>
                <button
                  onClick={() => setModal("investor")}
                  className="px-8 py-4 border border-white/20 hover:bg-white/5 transition-colors text-white font-mono font-bold tracking-widest text-sm rounded backdrop-blur-sm"
                >
                  INVESTOR ACCESS
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Platform Coverage */}
      <section className="py-32 px-6 relative border-t border-white/5">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl font-mono font-bold mb-6 text-white">Deployed Everywhere.</h2>
            <p className="text-xl text-slate-400 mb-16 max-w-3xl font-mono">Laptops. Workstations. Cloud Nodes. Autonomous Vehicles. One unified intelligence layer.</p>
          </FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn delay={200} className="relative group rounded-xl overflow-hidden border border-white/10 bg-slate-900/50">
              <img src="/images/frameless-autodrive.png" alt="Autonomous Vehicle Integration" className="w-full h-auto aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm mb-2">
                  <ActivitySquare className="w-4 h-4" /> Vehicle Integration Active
                </div>
                <p className="text-sm text-slate-300">Ethical brain layer engaged. No AI can take a vehicle action that violates safety protocols. Audited & Reversible.</p>
              </div>
            </FadeIn>
            <FadeIn delay={400}>
              <div className="p-8 rounded-xl border border-white/5 bg-[#0a0f1c] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl" />
                <div className="flex items-center gap-3 text-white/50 font-mono text-sm mb-8 uppercase tracking-widest">
                  <Network className="w-4 h-4" /> Global Mesh Status
                </div>
                <div className="space-y-8">
                  <div>
                    <div className="text-5xl font-mono font-black text-white mb-2 tracking-tight tabular-nums">
                      {activeNodes.toLocaleString()}
                    </div>
                    <div className="text-sm font-mono text-cyan-500">ACTIVE PLATFORM NODES</div>
                  </div>
                  <div className="space-y-4">
                    {[["Desktop / Laptop", "45.2%"], ["Cloud Infrastructure", "38.1%"], ["Autonomous Vehicles", "16.7%"]].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-sm font-mono border-b border-white/10 pb-2">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-white">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* AI Guardrails */}
      <section className="py-32 px-6 relative bg-[#010308] border-t border-white/5">
        <div className="absolute left-0 top-1/4 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 text-rose-500 text-sm font-mono tracking-widest mb-6 uppercase">
              <ShieldAlert className="w-4 h-4" /> Rogue Agent Prevention
            </div>
            <h2 className="text-4xl font-mono font-bold mb-6 text-white leading-tight">
              No agent goes <br /><span className="text-rose-500">off-rails. Ever.</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed font-mono">
              FRAMELESS watches every AI agent running on the system. If an agent begins behaving outside its defined ethical boundaries, it is isolated instantly.
            </p>
            <ul className="space-y-4 font-mono text-sm text-slate-300">
              {["Real-time intent analysis", "Instant memory quarantine", "Hardcoded ethical overrides"].map(i => (
                <li key={i} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> {i}</li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={300} className="relative">
            <div className="relative rounded-xl border border-rose-500/20 bg-[#050505] p-6 shadow-[0_0_50px_rgba(225,29,72,0.05)] overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent)] bg-[length:30px_30px]" />
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 relative z-10">
                <span className="font-mono text-xs text-white/50 tracking-widest uppercase">Agent Monitor</span>
                <span className="font-mono text-xs text-rose-500 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Live Tracking
                </span>
              </div>
              <div className="space-y-3 relative z-10">
                {agents.map(agent => (
                  <div
                    key={agent.id}
                    className={`flex items-center justify-between p-3 rounded border font-mono text-sm transition-all duration-500 ${
                      agent.status === "SAFE"     ? "border-white/5 bg-white/[0.02] text-slate-300"   :
                      agent.status === "WARNING"  ? "border-amber-500/30 bg-amber-500/10 text-amber-400" :
                                                    "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {agent.status === "SAFE"    ? <Activity className="w-4 h-4 text-green-500" /> :
                       agent.status === "WARNING" ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                                                    <Lock className="w-4 h-4 text-rose-500" />}
                      {agent.id}
                    </div>
                    <div className="text-xs tracking-widest font-bold">{agent.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Child Protection */}
      <section className="py-32 px-6 relative border-t border-amber-500/10 bg-[#0a0702]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
          <FadeIn>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-4xl md:text-6xl font-mono font-bold mb-6 text-white">
              Every parent's <span className="text-amber-500">default ON.</span>
            </h2>
            <p className="text-xl text-amber-100/70 max-w-3xl mx-auto leading-relaxed mb-16 font-mono">
              FRAMELESS incorporates a built-in behavioral detection layer trained on predatory digital patterns. NOT surveillance. PROTECTION.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
            {[
              { title: "Behavioral Detection", desc: "Monitors activity signatures, not content, ensuring privacy while identifying known predatory approach vectors." },
              { title: "Session Freezing", desc: "When thresholds are met, the device session is instantly frozen and secured against further interaction." },
              { title: "Auto-Reporting", desc: "Timestamped evidence packages are securely generated and automatically forwarded to appropriate authorities." },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 200}>
                <div className="p-8 rounded-xl bg-black border border-amber-500/10 hover:border-amber-500/30 transition-colors h-full">
                  <h3 className="text-xl font-mono font-bold text-amber-400 mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={600} className="w-full mt-16 rounded-2xl overflow-hidden border border-white/10 relative h-[400px]">
            <img src="/images/frameless-guardian.png" alt="Guardian System" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0702] via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8">
              <div className="text-xs font-mono tracking-widest text-amber-500 mb-2 uppercase">Guardian Protocol</div>
              <div className="text-2xl font-mono font-bold text-white">Protecting the most vulnerable, by design.</div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Threat Ecosystem */}
      <section className="py-32 px-6 relative bg-black border-t border-white/5 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 relative z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 text-green-400 text-sm font-mono tracking-widest mb-6 uppercase">
                <Fingerprint className="w-4 h-4" /> Ethics Enforcement
              </div>
              <h2 className="text-4xl font-mono font-bold mb-6 text-white leading-tight">
                Hackers. Piracy.<br />Nullified.
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed font-mono">
                When FRAMELESS detects unauthorized console access, suspicious privilege escalation, or known exploitation patterns — the session is flagged, timestamped, and law enforcement is notified automatically.
              </p>
              <p className="text-sm font-mono text-slate-500 border-l-2 border-green-500/30 pl-4">
                Each installation is cryptographically bound to a verified user identity. Pirated execution is structurally impossible.
              </p>
            </FadeIn>
          </div>
          <div className="lg:col-span-7 relative z-10">
            <FadeIn delay={300}>
              <div className="bg-[#020502] border border-green-900/30 rounded-lg shadow-2xl overflow-hidden">
                <div className="bg-black border-b border-green-900/30 px-4 py-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-green-600">/var/log/threat_matrix.sys</span>
                  <Radio className="w-4 h-4 text-green-500 animate-pulse" />
                </div>
                <div className="p-6 font-mono text-xs text-green-400 h-[300px] overflow-y-auto flex flex-col justify-end space-y-2 relative">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none" />
                  {threatFeed.map((log, i) => (
                    <div key={i} className="opacity-90 break-words" style={{ animation: "frameless-fade-in 0.3s ease-out forwards" }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Mental Wellness */}
      <section className="py-32 px-6 relative bg-[#050608] border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-mono font-bold mb-6 text-white">Mental Wellness Layer</h2>
            <p className="text-xl text-slate-400 font-light leading-relaxed mb-10">
              FRAMELESS monitors behavioral patterns—not content—for signs of crisis such as isolation, compulsive behavior cycles, or distress signals.
            </p>
            <div className="p-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-left max-w-2xl mx-auto">
              <p className="text-indigo-200/80 text-sm font-mono">
                When a threshold is reached, a calm, non-alarming wellness check-in appears. Resources are offered. With consent, a trusted contact is notified. Privacy-preserving. Opt-in. Potentially life-saving.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* The Collective — Network Graph */}
      <section className="py-32 px-6 relative border-t border-white/5 bg-[#030712] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="relative w-full h-[600px] max-w-4xl">
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-cyan-500 rounded-full shadow-[0_0_20px_cyan] animate-pulse" />
            <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_blue] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-3/4 left-1/2 w-5 h-5 bg-cyan-400 rounded-full shadow-[0_0_25px_cyan] animate-pulse" style={{ animationDelay: "0.5s" }} />
            <div className="absolute top-1/3 left-2/3 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_indigo] animate-pulse" style={{ animationDelay: "1.5s" }} />
            <div className="absolute top-2/3 left-1/3 w-3 h-3 bg-violet-400 rounded-full shadow-[0_0_12px_violet] animate-pulse" style={{ animationDelay: "0.8s" }} />
          </div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-mono font-bold text-white mb-8">
              The Collective <span className="text-cyan-400">Intelligence</span>
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed mb-16 max-w-2xl mx-auto">
              Every device running FRAMELESS shares anonymized threat intelligence with every other device. The system learns globally. Attacks that hit one node immediately train 84,000+ others.
            </p>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { val: "84,291+", label: "Active Nodes", color: "text-cyan-400" },
              { val: "17", label: "Countries", color: "text-blue-400" },
              { val: "6s", label: "Sync Interval", color: "text-violet-400" },
              { val: "100%", label: "Encrypted", color: "text-green-400" },
            ].map(s => (
              <FadeIn key={s.label}>
                <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className={`text-3xl font-mono font-black ${s.color} mb-2`}>{s.val}</div>
                  <div className="text-sm font-mono text-slate-500">{s.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Overview */}
      <section className="py-32 px-6 relative bg-black border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl font-mono font-bold text-white mb-12 flex items-center gap-3">
              <Terminal className="text-slate-500" /> Technical Overview
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Boot time", value: "<2s on NVMe SSD" },
              { label: "Memory footprint", value: "180MB base (ethical module: +40MB)" },
              { label: "AI Core", value: "On-device inference, zero cloud dependency" },
              { label: "Threat DB", value: "Updated every 6s from collective nodes" },
              { label: "Vehicle Integration", value: "CAN bus + AUTOSAR ADAPTIVE compliant" },
              { label: "Cloud Distribution", value: "SHA-256 signed, identity-bound installer" },
              { label: "Kernel Base", value: "FRAMELESS-patched 6.8 LTS" },
            ].map((spec, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="flex flex-col p-4 border border-white/10 bg-[#050505] rounded font-mono text-sm">
                  <span className="text-slate-500 mb-1 uppercase tracking-wider text-xs">{spec.label}</span>
                  <span className="text-cyan-400">{spec.value}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-40 px-6 relative bg-[#02040a] border-t border-cyan-500/20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-mono font-black text-white leading-tight mb-12">
              One OS. Every device.<br />
              Every child protected.<br />
              Every rogue AI stopped.<br />
              Every hacker exposed.<br />
              Every human empowered.<br />
              <span className="text-cyan-400 mt-6 block">This is not the future. This starts now.</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16">
              <button
                onClick={() => setModal("investor")}
                className="w-full sm:w-auto px-10 py-5 bg-cyan-500 text-black font-mono font-bold tracking-widest text-sm hover:bg-cyan-400 transition-all rounded shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                JOIN THE MISSION
              </button>
              <button
                onClick={() => setModal("download")}
                className="w-full sm:w-auto px-10 py-5 border border-white/20 hover:bg-white/5 transition-colors text-white font-mono font-bold tracking-widest text-sm rounded backdrop-blur-sm"
              >
                DOWNLOAD BETA
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <style>{`
        @keyframes frameless-fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
