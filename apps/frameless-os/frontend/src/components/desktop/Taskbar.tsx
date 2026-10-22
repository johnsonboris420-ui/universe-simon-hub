import { useEffect, useState } from "react";
import { Bell, Bot, Cpu, Settings, Shield } from "lucide-react";

interface TaskbarWindow {
  id: string;
  title: string;
  icon: string;
  minimized: boolean;
}

interface TaskbarProps {
  windows: TaskbarWindow[];
  onWindowClick: (id: string) => void;
  onStartClick: () => void;
  startOpen: boolean;
  onOpenApp: (app: string) => void;
  notifCount?: number;
  onOpenAria?: () => void;
  onOpenSysmon?: () => void;
  onOpenSettings?: () => void;
}

export function Taskbar({ windows, onWindowClick, onStartClick, startOpen, onOpenApp, notifCount = 0, onOpenAria, onOpenSysmon, onOpenSettings }: TaskbarProps) {
  const [time, setTime] = useState(new Date());
  const [netOk, setNetOk] = useState(true);
  const [threatCount, setThreatCount] = useState(47);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setThreatCount(n => n + (Math.random() > 0.7 ? 1 : 0));
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const PINNED = [
    { app: "browser",   icon: "🌐", label: "Browser"       },
    { app: "files",     icon: "📁", label: "Files"         },
    { app: "security",  icon: "⛨", label: "Security"      },
    { app: "slideshow", icon: "▶",  label: "Investor Deck" },
    { app: "terminal",  icon: "⬛", label: "Terminal"      },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center px-2 gap-1"
      style={{ height: "48px", background: "rgba(3,5,16,0.97)", borderTop: "1px solid rgba(0,212,255,0.2)", backdropFilter: "blur(20px)", zIndex: 9999 }}
    >
      {/* Start button */}
      <button
        onClick={onStartClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all"
        style={{ background: startOpen ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)", color: "hsl(185,100%,50%)", fontSize: "0.7rem", fontWeight: "bold", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}
      >
        <span style={{ fontSize: "1rem" }}>⬡</span>
        <span>FRAMELESS</span>
      </button>

      <div className="w-px h-6 mx-1" style={{ background: "rgba(0,212,255,0.15)" }} />

      {/* Pinned apps */}
      <div className="flex items-center gap-1">
        {PINNED.map((p) => (
          <button
            key={p.app}
            onClick={() => onOpenApp(p.app)}
            className="w-9 h-9 rounded flex items-center justify-center transition-all hover:bg-cyan-500/10"
            style={{ border: "1px solid rgba(0,212,255,0.1)", fontSize: "1rem" }}
            title={p.label}
          >
            {p.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-6 mx-1" style={{ background: "rgba(0,212,255,0.15)" }} />

      {/* Open window list */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0">
        {windows.map((win) => (
          <button
            key={win.id}
            onClick={() => onWindowClick(win.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all max-w-36 shrink-0"
            style={{
              background: win.minimized ? "transparent" : "rgba(0,212,255,0.12)",
              border: win.minimized ? "1px solid rgba(0,212,255,0.1)" : "1px solid rgba(0,212,255,0.3)",
              color: win.minimized ? "hsl(185,40%,50%)" : "hsl(185,100%,65%)",
              fontSize: "0.6rem",
              letterSpacing: "0.05em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span>{win.icon}</span>
            <span className="truncate">{win.title}</span>
            {!win.minimized && <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />}
          </button>
        ))}
      </div>

      {/* System tray */}
      <div className="ml-auto flex items-center gap-1 shrink-0">

        {/* Threat counter */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", cursor: "default" }}
          title={`${threatCount} threats blocked today`}
        >
          <Shield className="w-3 h-3 text-rose-400" />
          <span style={{ color: "hsl(0,80%,65%)", fontSize: "0.55rem", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>{threatCount} blocked</span>
        </div>

        {/* Quick launch: ARIA */}
        <button
          onClick={onOpenAria}
          title="ARIA AI Assistant"
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-cyan-500/15"
          style={{ border: "1px solid rgba(0,212,255,0.1)" }}
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        {/* Quick launch: System Monitor */}
        <button
          onClick={onOpenSysmon}
          title="System Monitor"
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-cyan-500/15"
          style={{ border: "1px solid rgba(0,212,255,0.1)" }}
        >
          <Cpu className="w-3.5 h-3.5" style={{ color: "hsl(185,60%,50%)" }} />
        </button>

        {/* Notification bell */}
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-cyan-500/15 relative"
          style={{ border: "1px solid rgba(0,212,255,0.1)" }}
        >
          <Bell className="w-3.5 h-3.5" style={{ color: "hsl(185,60%,50%)" }} />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-black" style={{ background: "rgb(239,68,68)", fontFamily: "'JetBrains Mono', monospace" }}>
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </button>

        {/* Settings gear */}
        <button
          onClick={onOpenSettings}
          title="System Settings"
          className="w-8 h-8 rounded flex items-center justify-center transition-all hover:bg-cyan-500/15"
          style={{ border: "1px solid rgba(0,212,255,0.1)" }}
        >
          <Settings className="w-3.5 h-3.5" style={{ color: "hsl(185,40%,45%)" }} />
        </button>

        <div className="w-px h-6 mx-1" style={{ background: "rgba(0,212,255,0.15)" }} />

        {/* Status + clock */}
        <div className="flex items-center gap-2 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(140,100%,50%)", boxShadow: "0 0 4px hsl(140,100%,50%)" }} />
            <span style={{ color: "hsl(140,80%,50%)", fontSize: "0.55rem", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>SECURE</span>
          </div>
          <div className="text-right">
            <div style={{ color: "hsl(185,100%,50%)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", fontWeight: "bold", lineHeight: "1" }}>
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </div>
            <div style={{ color: "hsl(185,40%,45%)", fontSize: "0.55rem", letterSpacing: "0.05em", fontFamily: "'JetBrains Mono', monospace" }}>
              {time.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
