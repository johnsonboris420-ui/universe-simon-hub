import { useEffect, useState, useCallback } from "react";

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  accent: string;
}

const slides: Slide[] = [
  {
    id: 1,
    accent: "hsl(185,100%,50%)",
    title: "FRAMELESS",
    subtitle: "The Self-Evolving Quantum Operating System",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
        <div style={{ fontSize: "5rem", lineHeight: 1, filter: "drop-shadow(0 0 40px rgba(0,212,255,0.6))" }}>⬡</div>
        <div>
          <div style={{ color: "hsl(185,60%,60%)", fontSize: "0.8rem", letterSpacing: "0.3em", marginBottom: "8px" }}>
            FRAMELESS SYSTEMS CORP — EST. 2026
          </div>
          <div style={{ color: "rgba(0,212,255,0.4)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>
            INVESTOR PRESENTATION — SERIES A — CONFIDENTIAL
          </div>
        </div>
        <div className="flex gap-8">
          {[
            { val: "$2.8B", label: "TAM 2026" },
            { val: "47K+", label: "Protected Devices" },
            { val: "99.9997%", label: "Uptime SLA" },
            { val: "<87ms", label: "Self-Heal Speed" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div style={{ color: "hsl(185,100%,50%)", fontSize: "1.4rem", fontWeight: 900, textShadow: "0 0 16px rgba(0,212,255,0.5)" }}>
                {s.val}
              </div>
              <div style={{ color: "hsl(185,40%,45%)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    accent: "hsl(0,100%,55%)",
    title: "THE PROBLEM",
    subtitle: "The world's operating systems are fundamentally broken",
    content: (
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="space-y-4">
          {[
            { icon: "💀", title: "4.8M Attacks Per Day", desc: "Modern OSes face constant zero-day exploits, ransomware, and state-sponsored attacks with no real-time defense." },
            { icon: "🧒", title: "800M Children Unprotected", desc: "Children using computers have zero built-in protection from predators, CSAM, and digital abuse at the OS level." },
            { icon: "🤖", title: "Rogue AI Uncontrolled", desc: "AI agents running on user systems have no ethics enforcement, kernel-level oversight, or automatic isolation capability." },
          ].map((p) => (
            <div key={p.title} className="flex gap-3 p-3 rounded" style={{ background: "rgba(255,0,64,0.08)", border: "1px solid rgba(255,0,64,0.15)" }}>
              <span style={{ fontSize: "1.5rem", minWidth: "28px" }}>{p.icon}</span>
              <div>
                <div style={{ color: "hsl(0,100%,65%)", fontSize: "0.75rem", fontWeight: "bold", marginBottom: "4px" }}>{p.title}</div>
                <div style={{ color: "hsl(185,40%,55%)", fontSize: "0.65rem", lineHeight: "1.6" }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center gap-4">
          <div style={{ color: "hsl(185,40%,45%)", fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "8px" }}>THE COST OF INACTION</div>
          {[
            { label: "Annual Cybercrime Cost", val: "$10.5 TRILLION", color: "hsl(0,100%,55%)" },
            { label: "Child Online Abuse Cases", val: "29M+/YEAR", color: "hsl(270,100%,65%)" },
            { label: "Zero-Day Exploits Published", val: "23,964", color: "hsl(30,100%,55%)" },
            { label: "Avg. Time to Detect Breach", val: "207 DAYS", color: "hsl(0,80%,60%)" },
          ].map((s) => (
            <div key={s.label} className="flex justify-between items-center p-2 rounded" style={{ background: "hsl(220,55%,7%)" }}>
              <span style={{ color: "hsl(185,40%,55%)", fontSize: "0.65rem" }}>{s.label}</span>
              <span style={{ color: s.color, fontWeight: 900, fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 3,
    accent: "hsl(140,100%,50%)",
    title: "THE SOLUTION",
    subtitle: "A living OS that heals, evolves, and protects everything",
    content: (
      <div className="flex flex-col items-center h-full">
        <div className="relative flex-1 flex items-center justify-center">
          <div className="relative">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, rgba(0,212,255,0.2), rgba(0,212,255,0.05))",
                border: "2px solid rgba(0,212,255,0.4)",
                boxShadow: "0 0 40px rgba(0,212,255,0.3)",
                fontSize: "3rem",
              }}
            >
              ⬡
            </div>
            {[
              { icon: "⟳", label: "SELF-HEAL", angle: 0, color: "hsl(140,100%,50%)" },
              { icon: "◈", label: "AI GUARD", angle: 60, color: "hsl(185,100%,50%)" },
              { icon: "⛨", label: "CHILD SAFE", angle: 120, color: "hsl(270,100%,65%)" },
              { icon: "⚡", label: "QUANTUM SEC", angle: 180, color: "hsl(50,100%,55%)" },
              { icon: "⬟", label: "MESH NET", angle: 240, color: "hsl(30,100%,55%)" },
              { icon: "∞", label: "SELF-EVOLVE", angle: 300, color: "hsl(300,100%,65%)" },
            ].map(({ icon, label, angle, color }) => {
              const rad = (angle - 90) * (Math.PI / 180);
              const r = 120;
              const x = r * Math.cos(rad);
              const y = r * Math.sin(rad);
              return (
                <div
                  key={label}
                  className="absolute flex flex-col items-center"
                  style={{ transform: `translate(${x - 28}px, ${y - 28}px)`, top: "50%", left: "50%" }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}50`,
                      color,
                      boxShadow: `0 0 12px ${color}40`,
                    }}
                  >
                    {icon}
                  </div>
                  <div style={{ color, fontSize: "0.5rem", fontWeight: "bold", letterSpacing: "0.06em", marginTop: "2px", whiteSpace: "nowrap" }}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full mt-4">
          {[
            { metric: "THREATS BLOCKED", val: "588,720", sub: "all-time" },
            { metric: "SELF-HEALS", val: "10", sub: "today alone" },
            { metric: "AI AGENTS ACTIVE", val: "7/8", sub: "1 isolated rogue AI" },
          ].map((s) => (
            <div key={s.metric} className="text-center p-2 rounded" style={{ background: "hsl(220,55%,7%)", border: "1px solid rgba(0,212,255,0.1)" }}>
              <div style={{ color: "hsl(140,100%,50%)", fontSize: "1.2rem", fontWeight: 900 }}>{s.val}</div>
              <div style={{ color: "hsl(185,40%,45%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>{s.metric}</div>
              <div style={{ color: "hsl(185,40%,35%)", fontSize: "0.5rem" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 4,
    accent: "hsl(50,100%,55%)",
    title: "QUANTUM SECURITY",
    subtitle: "Post-quantum cryptography meets zero-trust architecture",
    content: (
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="space-y-3">
          {[
            { icon: "🔐", name: "CRYSTALS-Kyber-1024", desc: "Post-quantum key encapsulation mechanism — unbreakable by both classical and quantum computers" },
            { icon: "🎲", name: "65,536-bit Entropy Pool", desc: "True quantum randomness seeded from hardware noise, atmospheric data, and network timing" },
            { icon: "🚫", name: "Zero-Trust Perimeter", desc: "Every process, every user, every network call is authenticated and verified — no implicit trust ever" },
            { icon: "🔏", name: "DILITHIUM-3 Signatures", desc: "Quantum-resistant digital signatures for all kernel code, driver updates, and AI agent communications" },
          ].map((f) => (
            <div key={f.name} className="flex gap-3 p-3 rounded" style={{ background: "hsl(220,55%,7%)", border: "1px solid rgba(255,200,0,0.1)" }}>
              <span style={{ fontSize: "1.3rem" }}>{f.icon}</span>
              <div>
                <div style={{ color: "hsl(50,100%,55%)", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "2px", fontFamily: "'JetBrains Mono', monospace" }}>{f.name}</div>
                <div style={{ color: "hsl(185,40%,55%)", fontSize: "0.62rem", lineHeight: "1.6" }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <div style={{ color: "hsl(50,100%,55%)", fontSize: "0.65rem", letterSpacing: "0.15em", fontWeight: "bold" }}>SECURITY PERFORMANCE</div>
          {[
            { label: "Threat Detection Rate", val: 99.7 },
            { label: "False Positive Rate", val: 0.3 },
            { label: "Zero-Day Coverage", val: 94.2 },
            { label: "Patch Deployment Speed", val: 100 },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between mb-1">
                <span style={{ color: "hsl(185,40%,50%)", fontSize: "0.65rem" }}>{s.label}</span>
                <span style={{ color: "hsl(50,100%,55%)", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: "bold" }}>
                  {s.label.includes("False") ? `${s.val}%` : `${s.val}%`}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.5)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(s.val, 100)}%`, background: s.label.includes("False") ? "hsl(140,100%,50%)" : "hsl(50,100%,55%)" }} />
              </div>
            </div>
          ))}
          <div className="mt-2 p-3 rounded" style={{ background: "rgba(50,100%,55,0.05)", border: "1px solid rgba(255,200,0,0.15)" }}>
            <div style={{ color: "hsl(50,100%,55%)", fontSize: "0.65rem", fontWeight: "bold", marginBottom: "4px" }}>RECENT BLOCKS</div>
            {["Zero-day browser exploit — patch distributed to 12,401 nodes", "LLM agent bypassing ethics module — isolated", "SSH brute force — attacker IP reported to LEA"].map((t) => (
              <div key={t} className="flex items-start gap-1.5 py-0.5" style={{ color: "hsl(185,40%,50%)", fontSize: "0.6rem" }}>
                <span style={{ color: "hsl(140,100%,50%)" }}>✓</span> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    accent: "hsl(270,100%,65%)",
    title: "CHILD PROTECTION",
    subtitle: "The first OS that protects children at the kernel level",
    content: (
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="flex flex-col justify-center space-y-4">
          <div className="text-center p-6 rounded" style={{ background: "rgba(160,0,255,0.08)", border: "1px solid rgba(160,0,255,0.2)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "8px" }}>🛡️</div>
            <div style={{ color: "hsl(270,100%,70%)", fontSize: "1rem", fontWeight: "900", letterSpacing: "0.1em" }}>
              GUARDIAN PROTOCOL
            </div>
            <div style={{ color: "hsl(185,40%,55%)", fontSize: "0.65rem", lineHeight: "1.8", marginTop: "8px" }}>
              The world's only OS with kernel-level child protection that cannot be disabled by any process, user, or application — not even root.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "CSAM Detection", val: "100%", color: "hsl(140,100%,50%)" },
              { label: "Grooming Patterns", val: "99.8%", color: "hsl(140,100%,50%)" },
              { label: "Auto LEA Report", val: "< 4s", color: "hsl(30,100%,55%)" },
              { label: "Guardian Alert", val: "< 1s", color: "hsl(185,100%,50%)" },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded" style={{ background: "hsl(220,55%,7%)", border: `1px solid ${s.color}20` }}>
                <div style={{ color: s.color, fontSize: "1rem", fontWeight: "900" }}>{s.val}</div>
                <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div style={{ color: "hsl(270,80%,70%)", fontSize: "0.65rem", letterSpacing: "0.15em", fontWeight: "bold" }}>PROTECTION LAYERS</div>
          {[
            { level: "KERNEL", desc: "Pattern detection runs in Ring 0 — unbypassable by any application or user", icon: "⚙" },
            { level: "NETWORK", desc: "Deep packet inspection blocks malicious content before it reaches applications", icon: "🌐" },
            { level: "AI", desc: "Behavioral AI analyzes conversation patterns and flags grooming in real-time", icon: "◈" },
            { level: "LAW ENFORCEMENT", desc: "Auto-generates case files and notifies authorities with full digital forensics", icon: "⚖" },
          ].map((l) => (
            <div key={l.level} className="flex gap-3 p-3 rounded" style={{ background: "hsl(220,55%,7%)", border: "1px solid rgba(160,0,255,0.12)" }}>
              <span style={{ fontSize: "1.2rem" }}>{l.icon}</span>
              <div>
                <div style={{ color: "hsl(270,80%,70%)", fontSize: "0.65rem", fontWeight: "bold", letterSpacing: "0.1em" }}>{l.level} LAYER</div>
                <div style={{ color: "hsl(185,40%,55%)", fontSize: "0.62rem", lineHeight: "1.6" }}>{l.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 6,
    accent: "hsl(300,100%,65%)",
    title: "SELF-EVOLUTION ENGINE",
    subtitle: "The OS that rewrites itself to become more intelligent every second",
    content: (
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="flex flex-col justify-center gap-4">
          <div style={{ color: "hsl(185,40%,50%)", fontSize: "0.65rem", lineHeight: "2", letterSpacing: "0.05em" }}>
            FRAMELESS doesn't just update — it <span style={{ color: "hsl(300,100%,65%)" }}>evolves</span>. The Self-Evolution Engine analyzes threat patterns across the entire global mesh and rewrites the most vulnerable sections of the OS automatically, in real time.
          </div>
          <div className="space-y-2">
            {[
              { phase: "01", title: "OBSERVE", desc: "Collective telemetry from 47K+ nodes", color: "hsl(185,100%,50%)" },
              { phase: "02", title: "ANALYZE", desc: "Quantum AI identifies vulnerability patterns", color: "hsl(270,100%,65%)" },
              { phase: "03", title: "SYNTHESIZE", desc: "New defense code is generated and verified", color: "hsl(140,100%,50%)" },
              { phase: "04", title: "DEPLOY", desc: "Patch distributed to all nodes in <87ms avg", color: "hsl(30,100%,55%)" },
              { phase: "05", title: "VERIFY", desc: "8 AI agents confirm zero regression", color: "hsl(300,100%,65%)" },
            ].map((p) => (
              <div key={p.phase} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: p.color, color: "hsl(220,60%,4%)" }}>
                  {p.phase}
                </div>
                <div className="flex-1 h-px" style={{ background: `${p.color}40` }} />
                <div className="text-right">
                  <div style={{ color: p.color, fontSize: "0.65rem", fontWeight: "bold" }}>{p.title}</div>
                  <div style={{ color: "hsl(185,40%,45%)", fontSize: "0.55rem" }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div style={{ color: "hsl(300,80%,70%)", fontSize: "0.65rem", letterSpacing: "0.15em", fontWeight: "bold" }}>EVOLUTION METRICS</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: "152,602", label: "Patches Distributed", color: "hsl(300,100%,65%)" },
              { val: "8,466", label: "Nodes Upgraded", color: "hsl(185,100%,50%)" },
              { val: "87ms", label: "Avg Deployment", color: "hsl(140,100%,50%)" },
              { val: "0", label: "Regressions Caused", color: "hsl(140,100%,50%)" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded" style={{ background: "hsl(220,55%,7%)", border: `1px solid ${s.color}20` }}>
                <div style={{ color: s.color, fontSize: "1.2rem", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
                <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.08em", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded mt-2" style={{ background: "rgba(160,0,255,0.06)", border: "1px solid rgba(160,0,255,0.15)" }}>
            <div style={{ color: "hsl(300,80%,70%)", fontSize: "0.65rem", fontWeight: "bold", marginBottom: "8px" }}>HOW IT'S DIFFERENT</div>
            {[
              "Windows: Manual patches every Tuesday",
              "macOS: Quarterly security updates",
              "Linux: Community patches, weeks later",
              "FRAMELESS: Autonomous healing in <87ms",
            ].map((c, i) => (
              <div key={c} className="flex items-center gap-2 py-0.5" style={{ color: i === 3 ? "hsl(140,100%,50%)" : "hsl(185,40%,40%)", fontSize: "0.62rem" }}>
                <span>{i === 3 ? "⚡" : "✗"}</span> {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    accent: "hsl(30,100%,55%)",
    title: "GLOBAL INTELLIGENCE MESH",
    subtitle: "Every device makes every other device smarter",
    content: (
      <div className="flex flex-col items-center h-full gap-6">
        <div className="grid grid-cols-5 gap-2 flex-1 w-full">
          {[
            ["NODE-US-001", "East Coast, USA", "online", 412, 83],
            ["NODE-UK-001", "London, UK", "online", 291, 44],
            ["NODE-DE-001", "Berlin, Germany", "online", 880, 201],
            ["NODE-JP-001", "Tokyo, Japan", "online", 1240, 340],
            ["NODE-AU-001", "Sydney, Australia", "online", 540, 112],
            ["NODE-BR-001", "São Paulo, Brazil", "online", 183, 29],
            ["NODE-CA-001", "Toronto, Canada", "syncing", 304, 71],
            ["NODE-FR-001", "Paris, France", "online", 730, 158],
            ["NODE-SG-001", "Singapore", "online", 890, 203],
            ["NODE-IN-001", "Mumbai, India", "online", 2100, 412],
          ].map(([id, loc, status, patches, threats]) => (
            <div
              key={id as string}
              className="p-2 rounded text-center"
              style={{
                background: "hsl(220,55%,7%)",
                border: `1px solid ${status === "online" ? "rgba(0,255,128,0.2)" : "rgba(255,140,0,0.2)"}`,
              }}
            >
              <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: status === "online" ? "hsl(140,100%,50%)" : "hsl(30,100%,55%)", boxShadow: `0 0 4px currentColor` }} />
              <div style={{ color: "hsl(185,80%,65%)", fontSize: "0.5rem", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>{id}</div>
              <div style={{ color: "hsl(185,40%,45%)", fontSize: "0.5rem" }}>{loc}</div>
              <div style={{ color: "hsl(30,100%,55%)", fontSize: "0.55rem", fontWeight: "bold", marginTop: "2px" }}>{patches as number}↑</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4 w-full">
          {[
            { val: "20", label: "GLOBAL NODES", color: "hsl(30,100%,55%)" },
            { val: "17", label: "COUNTRIES", color: "hsl(185,100%,50%)" },
            { val: "8,466", label: "PATCHES SHARED", color: "hsl(140,100%,50%)" },
            { val: "1,918", label: "THREATS SHARED", color: "hsl(0,100%,55%)" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded" style={{ background: "hsl(220,55%,7%)", border: `1px solid ${s.color}20` }}>
              <div style={{ color: s.color, fontSize: "1.2rem", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
              <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 8,
    accent: "hsl(185,100%,50%)",
    title: "ROADMAP 2026–2030",
    subtitle: "The future is being built today",
    content: (
      <div className="flex flex-col h-full gap-4">
        <div className="space-y-3 flex-1">
          {[
            {
              year: "Q2 2026", phase: "LAUNCH", color: "hsl(140,100%,50%)",
              items: ["Series A close ($25M)", "GA release to 100K beta users", "Node mesh live in 17 countries", "First enterprise contracts signed"],
            },
            {
              year: "Q4 2026", phase: "SCALE", color: "hsl(185,100%,50%)",
              items: ["1M protected devices", "Child Protection API for 3rd parties", "Quantum Security Certification", "Government sector partnerships"],
            },
            {
              year: "2027", phase: "EXPAND", color: "hsl(30,100%,55%)",
              items: ["Autonomous Vehicle OS integration", "Mobile (iOS/Android) kernel module", "Series B ($100M)", "Self-Evolution Engine v2.0"],
            },
            {
              year: "2028–2030", phase: "DOMINATE", color: "hsl(300,100%,65%)",
              items: ["100M+ devices protected worldwide", "Quantum cloud OS category leader", "IPO / Exit at $10B+ valuation", "Full AGI safety integration"],
            },
          ].map((phase) => (
            <div key={phase.year} className="flex gap-4 p-3 rounded" style={{ background: "hsl(220,55%,7%)", border: `1px solid ${phase.color}20` }}>
              <div className="text-center shrink-0" style={{ minWidth: "80px" }}>
                <div style={{ color: phase.color, fontSize: "0.75rem", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{phase.year}</div>
                <div style={{ color: phase.color, fontSize: "0.55rem", letterSpacing: "0.12em", opacity: 0.7 }}>{phase.phase}</div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {phase.items.map((item) => (
                  <div key={item} className="flex items-center gap-1" style={{ color: "hsl(185,50%,55%)", fontSize: "0.62rem" }}>
                    <span style={{ color: phase.color }}>→</span> {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 9,
    accent: "hsl(50,100%,55%)",
    title: "INVESTMENT OPPORTUNITY",
    subtitle: "Join us in building the future of computing",
    content: (
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded" style={{ background: "rgba(255,200,0,0.05)", border: "1px solid rgba(255,200,0,0.2)" }}>
            <div style={{ color: "hsl(50,100%,55%)", fontSize: "0.65rem", fontWeight: "bold", letterSpacing: "0.15em", marginBottom: "8px" }}>SERIES A — $25M</div>
            {[
              { pct: "40%", label: "Engineering & R&D", color: "hsl(185,100%,50%)" },
              { pct: "25%", label: "Sales & Marketing", color: "hsl(140,100%,50%)" },
              { pct: "20%", label: "Infrastructure & Scale", color: "hsl(30,100%,55%)" },
              { pct: "10%", label: "Legal & Compliance", color: "hsl(270,100%,65%)" },
              { pct: "5%", label: "Operations", color: "hsl(50,100%,55%)" },
            ].map((u) => (
              <div key={u.label} className="flex items-center gap-2 mb-1.5">
                <div className="w-8 text-right" style={{ color: u.color, fontWeight: "bold", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace" }}>{u.pct}</div>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <div className="h-full rounded-full" style={{ width: u.pct, background: u.color }} />
                </div>
                <div style={{ color: "hsl(185,40%,50%)", fontSize: "0.6rem" }}>{u.label}</div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded" style={{ background: "hsl(220,55%,7%)", border: "1px solid rgba(0,212,255,0.12)" }}>
            <div style={{ color: "hsl(185,80%,65%)", fontSize: "0.65rem", fontWeight: "bold", marginBottom: "8px" }}>WHY NOW</div>
            {[
              "Post-quantum cryptography standardization complete",
              "AI agent proliferation creating new attack surfaces",
              "Child safety regulation wave (EU DSA, US KOSA)",
              "Zero-trust mandates from governments worldwide",
            ].map((r) => (
              <div key={r} className="flex items-start gap-2 mb-1" style={{ color: "hsl(185,40%,55%)", fontSize: "0.62rem" }}>
                <span style={{ color: "hsl(50,100%,55%)" }}>⚡</span> {r}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: "$2.8B", label: "2026 TAM", color: "hsl(50,100%,55%)" },
              { val: "$18.4B", label: "2030 TAM", color: "hsl(140,100%,50%)" },
              { val: "67%", label: "YoY Growth", color: "hsl(185,100%,50%)" },
              { val: "3.2×", label: "Revenue Multiple", color: "hsl(300,100%,65%)" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded" style={{ background: "hsl(220,55%,7%)", border: `1px solid ${s.color}20` }}>
                <div style={{ color: s.color, fontSize: "1.4rem", fontWeight: 900 }}>{s.val}</div>
                <div style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded flex-1" style={{ background: "rgba(255,200,0,0.05)", border: "1px solid rgba(255,200,0,0.15)" }}>
            <div style={{ color: "hsl(50,100%,55%)", fontSize: "0.65rem", fontWeight: "bold", letterSpacing: "0.12em", marginBottom: "12px" }}>
              THE VISION
            </div>
            <div style={{ color: "hsl(185,40%,60%)", fontSize: "0.7rem", lineHeight: "2" }}>
              By 2030, FRAMELESS will protect every device on Earth — from smartphones to autonomous vehicles to cloud servers — with a single self-evolving quantum intelligence. The operating system will be the last line of defense between humanity and digital chaos.
            </div>
            <div style={{ color: "hsl(50,100%,55%)", fontSize: "0.65rem", fontWeight: "bold", marginTop: "12px", letterSpacing: "0.1em" }}>
              WE ARE NOT BUILDING AN OS.
            </div>
            <div style={{ color: "hsl(50,100%,55%)", fontSize: "0.65rem", fontWeight: "bold" }}>
              WE ARE BUILDING THE IMMUNE SYSTEM OF THE DIGITAL WORLD.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    accent: "hsl(185,100%,50%)",
    title: "THE FUTURE IS FRAMELESS",
    subtitle: "Self-Evolving · Quantum-Secured · AI-Guarded · Child-Safe",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
        <div style={{ fontSize: "4rem", filter: "drop-shadow(0 0 40px rgba(0,212,255,0.8))" }}>⬡</div>
        <div>
          <div
            style={{
              color: "hsl(185,100%,50%)",
              fontSize: "2.5rem",
              fontWeight: 900,
              letterSpacing: "0.3em",
              textShadow: "0 0 40px rgba(0,212,255,0.5)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            FRAMELESS
          </div>
          <div style={{ color: "hsl(185,60%,60%)", fontSize: "0.8rem", letterSpacing: "0.2em", marginTop: "8px" }}>
            THE OPERATING SYSTEM THAT NEVER DIES
          </div>
        </div>
        <div style={{ color: "hsl(185,40%,50%)", fontSize: "0.75rem", maxWidth: "500px", lineHeight: "2" }}>
          Join us. Invest in the future. Be part of the most important operating system ever built.
        </div>
        <div className="flex gap-6">
          {[
            { icon: "📧", label: "invest@frameless.os" },
            { icon: "🌐", label: "frameless.os" },
            { icon: "📞", label: "+1 (888) QUANTUM" },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-2" style={{ color: "hsl(185,80%,60%)", fontSize: "0.7rem" }}>
              <span>{c.icon}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.label}</span>
            </div>
          ))}
        </div>
        <div style={{ color: "hsl(185,40%,35%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>
          FRAMELESS SYSTEMS CORP — SERIES A — CONFIDENTIAL — 2026
        </div>
      </div>
    ),
  },
];

export function SlideshowApp() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [playing, next]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") setPlaying(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  const slide = slides[current];

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,60%,4%)", fontFamily: "'JetBrains Mono', monospace" }}>
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: "hsl(220,60%,6%)", borderBottom: `1px solid ${slide.accent}30` }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: slide.accent, fontWeight: 900, fontSize: "0.7rem", letterSpacing: "0.15em" }}>
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>
            QUANTUM VISION — INVESTOR DECK
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="w-7 h-7 rounded flex items-center justify-center text-sm" style={{ border: `1px solid ${slide.accent}30`, color: slide.accent }}>←</button>
          <button
            onClick={() => setPlaying(!playing)}
            className="px-3 py-1 rounded text-xs font-bold"
            style={{
              background: playing ? `${slide.accent}20` : "transparent",
              border: `1px solid ${slide.accent}40`,
              color: slide.accent,
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
            }}
          >
            {playing ? "⏸ PAUSE" : "▶ AUTO"}
          </button>
          <button onClick={next} className="w-7 h-7 rounded flex items-center justify-center text-sm" style={{ border: `1px solid ${slide.accent}30`, color: slide.accent }}>→</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="mb-4 shrink-0">
          <div
            className="text-2xl font-black tracking-widest"
            style={{
              color: slide.accent,
              textShadow: `0 0 20px ${slide.accent}60`,
              letterSpacing: "0.2em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {slide.title}
          </div>
          {slide.subtitle && (
            <div className="text-sm mt-1" style={{ color: "hsl(185,40%,50%)", letterSpacing: "0.08em" }}>
              {slide.subtitle}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">{slide.content}</div>
      </div>

      <div
        className="flex items-center justify-center gap-1.5 py-2 shrink-0"
        style={{ borderTop: `1px solid ${slide.accent}20` }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="transition-all rounded-full"
            style={{
              width: i === current ? "20px" : "6px",
              height: "6px",
              background: i === current ? slide.accent : "rgba(0,212,255,0.2)",
              boxShadow: i === current ? `0 0 6px ${slide.accent}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
