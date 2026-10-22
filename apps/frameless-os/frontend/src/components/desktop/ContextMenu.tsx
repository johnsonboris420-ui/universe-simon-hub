import { useEffect, useRef } from "react";
import { Bot, Globe, HardDrive, Layers, Monitor, RefreshCw, Settings, Terminal } from "lucide-react";

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  action?: () => void;
  divider?: boolean;
  sub?: string;
}

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  onOpenApp: (app: string) => void;
}

export function ContextMenu({ x, y, onClose, onOpenApp }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => document.addEventListener("mousedown", handle), 0);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", handle); document.removeEventListener("keydown", esc); };
  }, []);

  const vw = window.innerWidth, vh = window.innerHeight;
  const menuW = 220, menuH = 320;
  const cx = x + menuW > vw ? x - menuW : x;
  const cy = y + menuH > vh ? y - menuH : y;

  const items: MenuItem[] = [
    { label: "Open Browser",         icon: <Globe      className="w-3.5 h-3.5" />, action: () => onOpenApp("browser")   },
    { label: "Open ARIA Assistant",  icon: <Bot        className="w-3.5 h-3.5" />, action: () => onOpenApp("aria")      },
    { label: "File Explorer",        icon: <HardDrive  className="w-3.5 h-3.5" />, action: () => onOpenApp("files")     },
    { label: "System Monitor",       icon: <Monitor    className="w-3.5 h-3.5" />, action: () => onOpenApp("sysmon")    },
    { label: "Terminal",             icon: <Terminal   className="w-3.5 h-3.5" />, action: () => onOpenApp("terminal")  },
    { divider: true, label: "" },
    { label: "Settings",             icon: <Settings   className="w-3.5 h-3.5" />, action: () => onOpenApp("settings")  },
    { label: "Investor Slideshow",   icon: <Layers     className="w-3.5 h-3.5" />, action: () => onOpenApp("slideshow") },
    { divider: true, label: "" },
    { label: "Refresh Desktop",      icon: <RefreshCw  className="w-3.5 h-3.5" />, action: () => { onClose(); } },
    { label: "Display Settings",     icon: <Monitor    className="w-3.5 h-3.5" />, action: () => onOpenApp("settings"),  sub: "Resolution, scaling" },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-[99990]"
      style={{ left: cx, top: cy, fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div
        className="w-56 py-1 rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: "rgba(8,12,26,0.97)",
          border: "1px solid rgba(0,212,255,0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,212,255,0.1)",
          backdropFilter: "blur(30px)",
        }}
      >
        <div className="px-3 py-2 border-b text-[10px] text-slate-600 uppercase tracking-widest flex items-center gap-2" style={{ borderColor: "rgba(0,212,255,0.08)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Desktop
        </div>
        {items.map((item, i) =>
          item.divider ? (
            <div key={i} className="h-px mx-3 my-1" style={{ background: "rgba(0,212,255,0.08)" }} />
          ) : (
            <button
              key={i}
              onClick={() => { item.action?.(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-all group hover:bg-cyan-500/10"
              style={{ color: "hsl(185,60%,60%)" }}
            >
              <span className="text-slate-500 group-hover:text-cyan-400 transition-colors">{item.icon}</span>
              <span className="group-hover:text-white transition-colors">{item.label}</span>
              {item.sub && <span className="ml-auto text-[9px] text-slate-700">{item.sub}</span>}
            </button>
          )
        )}
      </div>
    </div>
  );
}
