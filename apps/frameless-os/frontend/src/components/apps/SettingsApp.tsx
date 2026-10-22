import { useState } from "react";
import { CheckCircle2, ChevronRight, Info, Lock, Shield, ShieldCheck, Sliders, User, Wifi, Zap } from "lucide-react";

interface Toggle { label: string; desc: string; value: boolean; locked?: boolean; }
type Section = {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  toggles: Toggle[];
  details?: { label: string; value: string }[];
};

function ToggleSwitch({ value, onChange, locked }: { value: boolean; onChange: (v: boolean) => void; locked?: boolean }) {
  return (
    <button
      onClick={() => !locked && onChange(!value)}
      className={`w-10 h-5 rounded-full relative transition-all shrink-0 ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ background: value ? "hsl(185,100%,50%)" : "rgba(255,255,255,0.1)", border: value ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.1)", boxShadow: value ? "0 0 10px rgba(0,212,255,0.4)" : "none" }}
    >
      <div className="absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 shadow-md" style={{ left: value ? "calc(100% - 18px)" : "2px", background: value ? "#000" : "#666" }} />
      {locked && <Lock className="absolute right-0.5 top-0.5 w-2.5 h-2.5" style={{ color: "#888" }} />}
    </button>
  );
}

export function SettingsApp() {
  const [activeSection, setActiveSection] = useState("security");
  const [sections, setSections] = useState<Section[]>([
    {
      id: "security", icon: <Shield className="w-4 h-4" />, label: "Security", color: "#06b6d4",
      toggles: [
        { label: "Quantum Encryption",    desc: "CRYSTALS-Kyber-1024 post-quantum encryption for all data at rest and in transit", value: true,  locked: true },
        { label: "Zero-Trust Mode",       desc: "Every process verified before resource access — no implicit trust", value: true,  locked: false },
        { label: "Auto Self-Heal",        desc: "Autonomous system repair when integrity violations are detected", value: true,  locked: false },
        { label: "Kernel Memory Guard",   desc: "Hardware-enforced memory protection against buffer overflows and injection", value: true,  locked: true },
        { label: "Secure Boot Chain",     desc: "All modules cryptographically signed before loading at boot", value: true,  locked: true },
        { label: "Behavioral Telemetry",  desc: "Share anonymized threat intelligence with the global mesh", value: true,  locked: false },
      ],
      details: [
        { label: "Encryption standard",   value: "CRYSTALS-Kyber-1024" },
        { label: "Key derivation",        value: "HKDF-SHA3-512" },
        { label: "Secure boot",           value: "TPM 2.0 + kernel attestation" },
        { label: "Last security audit",   value: "Apr 10, 2026 — PASSED" },
      ],
    },
    {
      id: "guardian", icon: <ShieldCheck className="w-4 h-4" />, label: "Guardian", color: "#f59e0b",
      toggles: [
        { label: "Guardian Protocol",       desc: "Child protection behavioral detection — kernel-level, cannot be disabled by software", value: true, locked: true },
        { label: "Auto LEA Reporting",      desc: "Automatically notify law enforcement when predatory patterns are confirmed", value: true, locked: true },
        { label: "Parent Alerts — SMS",     desc: "Notify registered guardian via SMS when a Guardian event triggers", value: true, locked: false },
        { label: "Parent Alerts — Email",   desc: "Notify registered guardian via email when a Guardian event triggers", value: true, locked: false },
        { label: "Session Recording Mode",  desc: "Encrypt and preserve session during a Guardian event for evidence", value: true, locked: true },
        { label: "Wellness Check-Ins",      desc: "Gentle wellness prompts when behavioral distress patterns are detected", value: true, locked: false },
      ],
      details: [
        { label: "Pattern library",       value: "94,711 signatures" },
        { label: "Detection latency",     value: "< 200ms" },
        { label: "LEA notification time", value: "< 4 seconds" },
        { label: "Privacy model",         value: "Behavioral, not content" },
      ],
    },
    {
      id: "ai", icon: <Zap className="w-4 h-4" />, label: "AI Agents", color: "#a855f7",
      toggles: [
        { label: "Ethics Enforcement",    desc: "All AI agents operate within hardcoded ethical bounds — cannot be disabled", value: true, locked: true },
        { label: "Auto-Isolation",        desc: "Agents with ethics score < 50 are automatically isolated without human approval", value: true, locked: true },
        { label: "Behavioral Logging",    desc: "Log all AI agent actions for audit trail", value: true, locked: false },
        { label: "ARIA Assistant",        desc: "Enable ARIA, the on-device AI runtime intelligence agent", value: true, locked: false },
        { label: "Agent Telemetry",       desc: "Share anonymized agent behavior patterns with FRAMELESS research", value: false, locked: false },
      ],
      details: [
        { label: "Ethics threshold",      value: "Score < 50 → auto-isolate" },
        { label: "Response latency",      value: "< 300ms (on-device)" },
        { label: "Model size",            value: "7B params, 4-bit quantized" },
        { label: "Inference mode",        value: "On-device only (zero cloud)" },
      ],
    },
    {
      id: "network", icon: <Wifi className="w-4 h-4" />, label: "Network", color: "#22c55e",
      toggles: [
        { label: "Mesh Participation",    desc: "Join the global FRAMELESS node mesh to share threat intelligence", value: true,  locked: false },
        { label: "Automatic Patching",    desc: "Apply verified security patches automatically when available", value: true,  locked: false },
        { label: "Firewall",              desc: "Hardware-enforced network firewall with deep packet inspection", value: true,  locked: true },
        { label: "DNS-over-HTTPS",        desc: "Encrypt DNS queries to prevent surveillance and manipulation", value: true,  locked: false },
        { label: "Traffic Obfuscation",   desc: "Obfuscate network fingerprint to prevent tracking", value: false, locked: false },
      ],
      details: [
        { label: "Active nodes",          value: "84,291" },
        { label: "Sync interval",         value: "Every 6 seconds" },
        { label: "Protocol",              value: "FRAMELESS-MESH v3 (E2EE)" },
        { label: "Bandwidth used",        value: "~2.1 MB/day" },
      ],
    },
    {
      id: "privacy", icon: <Lock className="w-4 h-4" />, label: "Privacy", color: "#ef4444",
      toggles: [
        { label: "Data Minimization",     desc: "Only collect data strictly required for operation", value: true,  locked: false },
        { label: "Local Processing",      desc: "All AI inference happens on-device, no cloud dependency", value: true,  locked: false },
        { label: "Encrypted Storage",     desc: "All user data encrypted at rest using your device key", value: true,  locked: true },
        { label: "Audit Logs",            desc: "Keep a local cryptographic audit log of all system events", value: true,  locked: false },
        { label: "Crash Reports",         desc: "Send anonymized crash data to FRAMELESS to improve stability", value: false, locked: false },
      ],
      details: [
        { label: "Data location",         value: "On-device only" },
        { label: "Cloud dependencies",    value: "Zero" },
        { label: "Analytics",             value: "Opt-in only, anonymized" },
        { label: "GDPR compliance",       value: "Full" },
      ],
    },
    {
      id: "account", icon: <User className="w-4 h-4" />, label: "Account", color: "#06b6d4",
      toggles: [],
      details: [
        { label: "License",               value: "FRAMELESS Enterprise — Active" },
        { label: "Device ID",             value: "FRL-α7Kx-2941-mNQp" },
        { label: "License expires",       value: "Apr 28, 2027" },
        { label: "Support tier",          value: "Priority — 4h SLA" },
        { label: "Beta channel",          value: "Enabled" },
        { label: "Last update",           value: "Apr 10, 2026 — v2.4.1" },
      ],
    },
  ]);

  const toggleValue = (sectionId: string, idx: number, val: boolean) => {
    setSections(p => p.map(s => s.id === sectionId ? { ...s, toggles: s.toggles.map((t, i) => i === idx ? { ...t, value: val } : t) } : s));
  };

  const active = sections.find(s => s.id === activeSection)!;

  return (
    <div className="flex h-full" style={{ background: "hsl(220,60%,4%)", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r flex flex-col gap-0.5 p-2" style={{ background: "hsl(220,60%,5%)", borderColor: "rgba(0,212,255,0.1)" }}>
        <div className="text-[10px] text-slate-600 uppercase tracking-widest px-2 py-2">Settings</div>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all"
            style={{ background: activeSection === s.id ? `${s.color}18` : "transparent", border: activeSection === s.id ? `1px solid ${s.color}40` : "1px solid transparent", color: activeSection === s.id ? s.color : "hsl(185,30%,45%)" }}>
            {s.icon} {s.label}
            {activeSection === s.id && <ChevronRight className="w-3 h-3 ml-auto" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${active.color}15`, border: `1px solid ${active.color}30`, color: active.color }}>
            {active.icon}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{active.label}</div>
            <div className="text-[10px] text-slate-500">{active.toggles.length} settings · {active.details?.length ?? 0} info</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-400">
            <CheckCircle2 className="w-3 h-3" /> All saved automatically
          </div>
        </div>

        {active.toggles.length > 0 && (
          <div className="space-y-2 mb-6">
            {active.toggles.map((tog, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg transition-all"
                style={{ background: tog.value ? `${active.color}08` : "hsl(220,55%,6%)", border: `1px solid ${tog.value ? active.color + "20" : "rgba(255,255,255,0.04)"}` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-white font-medium">{tog.label}</span>
                    {tog.locked && (
                      <span className="flex items-center gap-0.5 text-[9px] text-slate-600 border border-white/10 px-1 rounded">
                        <Lock className="w-2 h-2" /> kernel
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{tog.desc}</p>
                </div>
                <ToggleSwitch value={tog.value} onChange={(v) => toggleValue(active.id, i, v)} locked={tog.locked} />
              </div>
            ))}
          </div>
        )}

        {active.details && active.details.length > 0 && (
          <div className="p-4 rounded-lg" style={{ background: "hsl(220,55%,6%)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest mb-3">
              <Info className="w-3 h-3" /> System Information
            </div>
            <div className="space-y-2">
              {active.details.map(d => (
                <div key={d.label} className="flex justify-between py-1.5 border-b text-xs" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <span className="text-slate-500">{d.label}</span>
                  <span style={{ color: active.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {active.id === "account" && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Check for Updates", color: "#06b6d4" },
              { label: "Manage License",    color: "#06b6d4" },
              { label: "Export Audit Log",  color: "#a855f7" },
              { label: "Reset to Defaults", color: "#ef4444" },
            ].map(b => (
              <button key={b.label} className="py-2 rounded-lg text-xs font-bold tracking-widest transition-all hover:opacity-80"
                style={{ background: `${b.color}15`, border: `1px solid ${b.color}30`, color: b.color }}>
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
