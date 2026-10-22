import { useEffect, useState } from "react";

interface BootProps {
  onBootComplete: () => void;
}

const BOOT_LINES = [
  { text: "FRAMELESS OS BIOS v2.4.1 — Quantum Security Edition", delay: 0 },
  { text: "Copyright © 2026 FRAMELESS SYSTEMS CORP — All Rights Reserved", delay: 80 },
  { text: "", delay: 120 },
  { text: "CPU: FRAMELESS-QUANTUM-CORE × 512 @ 8.0 GHz — OK", delay: 200 },
  { text: "RAM: 2,048 GB ECC LPDDR6 — OK", delay: 320 },
  { text: "NVME: 64 TB NVMe Encrypted Storage — OK", delay: 440 },
  { text: "NET: 100 Gbps Encrypted Mesh — OK", delay: 560 },
  { text: "", delay: 640 },
  { text: "Initializing AI Guard Layer... ████████████████ DONE", delay: 720 },
  { text: "Loading Threat Intelligence Engine... ████████████████ DONE", delay: 880 },
  { text: "Activating Child Protection Module... ████████████████ DONE", delay: 1040 },
  { text: "Calibrating Self-Healing Core... ████████████████ DONE", delay: 1200 },
  { text: "Deploying Rogue AI Firewall... ████████████████ DONE", delay: 1360 },
  { text: "Synchronizing Node Mesh (20 nodes / 17 countries)... DONE", delay: 1520 },
  { text: "", delay: 1640 },
  { text: "SECURITY HANDSHAKE: SHA-3 / CRYSTALS-Kyber-1024 — VERIFIED ✓", delay: 1720 },
  { text: "QUANTUM ENTROPY POOL: 65,536 bits — SEEDED ✓", delay: 1840 },
  { text: "ZERO-TRUST PERIMETER: ACTIVE ✓", delay: 1960 },
  { text: "", delay: 2080 },
  { text: "▶ FRAMELESS OS MISSION CONTROL LOADING...", delay: 2200 },
];

export default function Boot({ onBootComplete }: BootProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers = BOOT_LINES.map((line, index) =>
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, index]);
        setProgress(Math.round(((index + 1) / BOOT_LINES.length) * 100));
      }, line.delay)
    );

    const completeTimer = setTimeout(() => {
      onBootComplete();
    }, 3200);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [onBootComplete]);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((c) => !c), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: "#020408", fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div className="scan-overlay" />

      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div
            className="text-5xl font-black tracking-widest mb-2"
            style={{
              color: "hsl(185,100%,50%)",
              textShadow: "0 0 20px rgba(0,212,255,0.9), 0 0 60px rgba(0,212,255,0.4)",
              letterSpacing: "0.3em",
            }}
          >
            FRAMELESS
          </div>
          <div
            className="text-sm tracking-widest"
            style={{ color: "hsl(185,60%,50%)", letterSpacing: "0.5em" }}
          >
            OPERATING SYSTEM
          </div>
        </div>

        <div
          className="rounded p-6 text-sm space-y-0.5"
          style={{
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(0,212,255,0.2)",
            boxShadow: "0 0 32px rgba(0,212,255,0.1), inset 0 0 32px rgba(0,0,0,0.5)",
            minHeight: "320px",
          }}
        >
          {BOOT_LINES.map((line, index) => (
            <div
              key={index}
              style={{
                opacity: visibleLines.includes(index) ? 1 : 0,
                transition: "opacity 0.1s",
                color: line.text.includes("DONE") || line.text.includes("✓")
                  ? "hsl(140,100%,50%)"
                  : line.text.includes("▶")
                  ? "hsl(185,100%,50%)"
                  : line.text.includes("BIOS") || line.text.includes("Copyright")
                  ? "hsl(185,80%,70%)"
                  : "hsl(185,40%,65%)",
                textShadow: line.text.includes("DONE") || line.text.includes("✓")
                  ? "0 0 6px rgba(0,255,128,0.5)"
                  : "none",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                lineHeight: "1.6",
              }}
            >
              {line.text || "\u00A0"}
              {index === visibleLines[visibleLines.length - 1] && line.text && (
                <span style={{ opacity: showCursor ? 1 : 0, color: "hsl(185,100%,50%)" }}>█</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs mb-1" style={{ color: "hsl(185,60%,45%)", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
            <span>SYSTEM INITIALIZATION</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,212,255,0.1)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, hsl(185,100%,40%), hsl(185,100%,60%))",
                boxShadow: "0 0 8px rgba(0,212,255,0.6)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
