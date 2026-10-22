import { useCallback, useEffect, useRef, useState } from "react";
import { Window } from "./Window";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { ContextMenu } from "./ContextMenu";
import { NotificationSystem, useNotificationEmitter } from "./NotificationSystem";
import { BrowserApp } from "../apps/BrowserApp";
import { FileExplorerApp } from "../apps/FileExplorerApp";
import { SlideshowApp } from "../apps/SlideshowApp";
import { SecurityMonitorApp } from "../apps/SecurityMonitorApp";
import { TerminalApp } from "../apps/TerminalApp";
import { AiAssistant } from "../apps/AiAssistant";
import { SystemMonitorApp } from "../apps/SystemMonitorApp";
import { SettingsApp } from "../apps/SettingsApp";

export type AppId =
  | "browser" | "files" | "security" | "slideshow" | "terminal"
  | "settings" | "threats" | "agents" | "nodes" | "aria" | "sysmon";

interface WinState {
  id: string;
  app: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

const APP_META: Record<AppId, { title: string; icon: string; width: number; height: number; offsetX?: number; offsetY?: number }> = {
  browser:   { title: "FRAMELESS Browser",    icon: "🌐", width: 900, height: 580, offsetX: 60,  offsetY: 30  },
  files:     { title: "File Explorer",         icon: "📁", width: 760, height: 520, offsetX: 120, offsetY: 50  },
  security:  { title: "Security Monitor",      icon: "⛨", width: 800, height: 560, offsetX: 80,  offsetY: 60  },
  slideshow: { title: "Quantum Vision",        icon: "▶",  width: 880, height: 580, offsetX: 40,  offsetY: 20  },
  terminal:  { title: "Quantum Terminal",      icon: "⬛", width: 680, height: 440, offsetX: 160, offsetY: 70  },
  settings:  { title: "System Settings",       icon: "⚙",  width: 680, height: 520, offsetX: 200, offsetY: 60  },
  threats:   { title: "Threat Feed",           icon: "⚠",  width: 800, height: 560, offsetX: 80,  offsetY: 60  },
  agents:    { title: "AI Agent Monitor",      icon: "◈",  width: 800, height: 560, offsetX: 90,  offsetY: 65  },
  nodes:     { title: "Network Nodes",         icon: "⬟",  width: 800, height: 560, offsetX: 100, offsetY: 70  },
  aria:      { title: "ARIA — AI Assistant",   icon: "🤖", width: 680, height: 560, offsetX: 140, offsetY: 40  },
  sysmon:    { title: "System Monitor",        icon: "📊", width: 760, height: 540, offsetX: 110, offsetY: 50  },
};

const DESKTOP_ICONS: { app: AppId; icon: string; label: string }[] = [
  { app: "browser",   icon: "🌐", label: "Browser"        },
  { app: "aria",      icon: "🤖", label: "ARIA AI"        },
  { app: "files",     icon: "📁", label: "Files"          },
  { app: "security",  icon: "⛨", label: "Security"       },
  { app: "sysmon",    icon: "📊", label: "System"         },
  { app: "slideshow", icon: "▶",  label: "Investor Deck"  },
  { app: "terminal",  icon: "⬛", label: "Terminal"       },
  { app: "settings",  icon: "⚙",  label: "Settings"       },
  { app: "threats",   icon: "⚠",  label: "Threat Feed"    },
  { app: "agents",    icon: "◈",  label: "AI Agents"      },
  { app: "nodes",     icon: "⬟",  label: "Nodes"          },
];

let winCounter = 0;

function makeWindow(app: AppId, zIndex: number): WinState {
  const meta = APP_META[app];
  const vw = window.innerWidth;
  const vh = window.innerHeight - 48;
  const x = Math.max(20, Math.min((meta.offsetX ?? 60) + (winCounter % 3) * 24, vw - meta.width - 20));
  const y = Math.max(20, Math.min((meta.offsetY ?? 30) + (winCounter % 3) * 24, vh - meta.height - 20));
  return {
    id: `${app}-${++winCounter}`,
    app,
    title: meta.title,
    icon: meta.icon,
    x,
    y,
    width: meta.width,
    height: meta.height,
    zIndex,
    minimized: false,
    maximized: false,
  };
}

function AppContent({ app }: { app: AppId }) {
  switch (app) {
    case "browser":   return <BrowserApp />;
    case "files":     return <FileExplorerApp />;
    case "security":
    case "threats":
    case "agents":
    case "nodes":     return <SecurityMonitorApp />;
    case "slideshow": return <SlideshowApp />;
    case "terminal":  return <TerminalApp />;
    case "aria":      return <AiAssistant />;
    case "sysmon":    return <SystemMonitorApp />;
    case "settings":  return <SettingsApp />;
    default:          return <div className="p-4 text-sm" style={{ color: "hsl(185,60%,50%)" }}>App not found</div>;
  }
}

export function Desktop() {
  const [windows, setWindows] = useState<WinState[]>([]);
  const [zCounter, setZCounter] = useState(100);
  const [startOpen, setStartOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);

  const { notifications, dismiss: dismissNotif, count: notifCount } = useNotificationEmitter();

  const getNextZ = useCallback(() => {
    const z = zCounter + 1;
    setZCounter(z);
    return z;
  }, [zCounter]);

  const openApp = useCallback((app: AppId) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.app === app);
      if (existing) {
        const z = zCounter + 1;
        setZCounter(z);
        return prev.map((w) => w.app === app ? { ...w, minimized: false, zIndex: z } : w);
      }
      const z = zCounter + 1;
      setZCounter(z);
      return [...prev, makeWindow(app, z)];
    });
  }, [zCounter]);

  useEffect(() => {
    const timer = setTimeout(() => openApp("browser"), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (startMenuRef.current && !startMenuRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
    };
    if (startOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [startOpen]);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const z = Math.max(...prev.map((w) => w.zIndex)) + 1;
      return prev.map((w) => w.id === id ? { ...w, zIndex: z } : w);
    });
  }, []);

  const closeWindow  = useCallback((id: string) => setWindows((p) => p.filter((w) => w.id !== id)), []);
  const minimizeWin  = useCallback((id: string) => setWindows((p) => p.map((w) => w.id === id ? { ...w, minimized: true } : w)), []);
  const maximizeWin  = useCallback((id: string) => setWindows((p) => p.map((w) => w.id === id ? { ...w, maximized: !w.maximized } : w)), []);
  const moveWindow   = useCallback((id: string, x: number, y: number) => setWindows((p) => p.map((w) => w.id === id ? { ...w, x, y } : w)), []);

  const handleTaskbarClick = useCallback((id: string) => {
    setWindows((prev) => {
      const win = prev.find((w) => w.id === id);
      if (!win) return prev;
      if (win.minimized) {
        const z = Math.max(...prev.map((w) => w.zIndex)) + 1;
        return prev.map((w) => w.id === id ? { ...w, minimized: false, zIndex: z } : w);
      }
      return prev.map((w) => w.id === id ? { ...w, minimized: true } : w);
    });
  }, []);

  const handleDesktopRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setStartOpen(false);
  }, []);

  return (
    <div
      className="relative w-screen overflow-hidden"
      style={{ height: "calc(100vh - 48px)", userSelect: "none" }}
      onClick={(e) => { setStartOpen(false); setSelectedIcon(null); setContextMenu(null); }}
      onContextMenu={handleDesktopRightClick}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(0,40,80,0.6) 0%, hsl(220,70%,3%) 60%)" }} />
      <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 20%, rgba(0,100,200,0.12) 0%, transparent 50%)" }} />

      {/* Desktop icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2" style={{ zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
        {DESKTOP_ICONS.map((di) => (
          <button
            key={di.app}
            onDoubleClick={() => openApp(di.app)}
            onClick={(e) => { e.stopPropagation(); setSelectedIcon(di.app); }}
            className="flex flex-col items-center gap-1 p-2 rounded transition-all"
            style={{ width: "72px", background: selectedIcon === di.app ? "rgba(0,212,255,0.15)" : "transparent", border: selectedIcon === di.app ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent" }}
          >
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,212,255,0.15)", fontSize: "1.4rem", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              {di.icon}
            </div>
            <span className="text-center leading-tight" style={{ color: "hsl(185,80%,75%)", fontSize: "0.55rem", fontFamily: "'JetBrains Mono', monospace", textShadow: "0 1px 4px rgba(0,0,0,0.8)", fontWeight: "bold", letterSpacing: "0.05em" }}>
              {di.label}
            </span>
          </button>
        ))}
      </div>

      {/* Watermark */}
      <div className="absolute bottom-20 right-6 text-right pointer-events-none" style={{ zIndex: 5 }}>
        <div style={{ color: "rgba(0,212,255,0.2)", fontSize: "3.5rem", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.3em", lineHeight: 1, textShadow: "0 0 40px rgba(0,212,255,0.1)" }}>
          FRAMELESS
        </div>
        <div style={{ color: "rgba(0,212,255,0.1)", fontSize: "0.65rem", letterSpacing: "0.4em" }}>QUANTUM OS v2.4.1</div>
      </div>

      {/* Windows */}
      {windows.map((win) => (
        <Window key={win.id} {...win} onFocus={focusWindow} onClose={closeWindow} onMinimize={minimizeWin} onMaximize={maximizeWin} onMove={moveWindow}>
          <AppContent app={win.app} />
        </Window>
      ))}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenApp={(app) => { openApp(app as AppId); setContextMenu(null); }}
        />
      )}

      {/* Notifications */}
      <NotificationSystem notifications={notifications} onDismiss={dismissNotif} />

      {/* Start menu + taskbar */}
      <div ref={startMenuRef}>
        {startOpen && (
          <StartMenu
            onOpenApp={(app) => { openApp(app as AppId); setStartOpen(false); }}
            onClose={() => setStartOpen(false)}
          />
        )}
        <Taskbar
          windows={windows}
          onWindowClick={handleTaskbarClick}
          onStartClick={() => setStartOpen((s) => !s)}
          startOpen={startOpen}
          onOpenApp={(app) => openApp(app as AppId)}
          notifCount={notifCount}
          onOpenAria={() => openApp("aria")}
          onOpenSysmon={() => openApp("sysmon")}
          onOpenSettings={() => openApp("settings")}
        />
      </div>
    </div>
  );
}
