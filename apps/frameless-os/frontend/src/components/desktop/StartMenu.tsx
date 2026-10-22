interface App {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

const APPS: App[] = [
  { id: "browser",   name: "FRAMELESS Browser",    icon: "🌐", description: "Quantum-encrypted web browser with real-time security scanning", category: "Internet"     },
  { id: "aria",      name: "ARIA AI Assistant",     icon: "🤖", description: "On-device AI agent — security briefings & system intelligence",  category: "AI"          },
  { id: "files",     name: "File Explorer",         icon: "📁", description: "Browse and manage files and folders",                            category: "System"       },
  { id: "security",  name: "Security Monitor",      icon: "⛨", description: "Real-time threat dashboard with live API data",                  category: "Security"     },
  { id: "sysmon",    name: "System Monitor",        icon: "📊", description: "Live CPU, RAM, network graphs and process manager",              category: "System"       },
  { id: "slideshow", name: "Quantum Vision",        icon: "▶",  description: "10-slide investor presentation with self-evolving OS thesis",    category: "Productivity" },
  { id: "terminal",  name: "Quantum Terminal",      icon: "⬛", description: "Interactive system command interface",                          category: "System"       },
  { id: "settings",  name: "System Settings",       icon: "⚙",  description: "Configure security, privacy, AI agents, and network",           category: "System"       },
  { id: "threats",   name: "Threat Feed",           icon: "⚠",  description: "Live threat intelligence from global mesh",                     category: "Security"     },
  { id: "agents",    name: "AI Agent Monitor",      icon: "◈",  description: "Real-time AI guardian ethics monitoring",                       category: "AI"          },
  { id: "nodes",     name: "Network Nodes",         icon: "⬟",  description: "Global mesh network topology — 84,291 nodes",                  category: "Network"      },
];

const CATEGORIES = ["All", "Internet", "AI", "Security", "Network", "System", "Productivity"];

interface StartMenuProps {
  onOpenApp: (app: string) => void;
  onClose: () => void;
}

import { useState } from "react";

export function StartMenu({ onOpenApp, onClose }: StartMenuProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = APPS.filter((a) => {
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || a.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleOpen = (id: string) => {
    onOpenApp(id);
    onClose();
  };

  return (
    <div
      className="fixed bottom-12 left-0 w-80 rounded-sm overflow-hidden"
      style={{
        background: "rgba(5,8,20,0.97)",
        border: "1px solid rgba(0,212,255,0.25)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,212,255,0.1)",
        zIndex: 9998,
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="p-3" style={{ borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
        <div
          className="text-xs font-black tracking-widest mb-1"
          style={{ color: "hsl(185,100%,50%)", fontSize: "0.65rem", letterSpacing: "0.2em", textShadow: "0 0 8px rgba(0,212,255,0.5)" }}
        >
          FRAMELESS OS v2.4.1
        </div>
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apps..."
          className="w-full px-2.5 py-1.5 rounded text-xs outline-none"
          style={{
            background: "rgba(0,212,255,0.06)",
            border: "1px solid rgba(0,212,255,0.2)",
            color: "hsl(185,80%,70%)",
            fontSize: "0.7rem",
          }}
        />
      </div>

      <div className="flex gap-1 px-3 py-2" style={{ borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="px-2 py-0.5 rounded text-xs transition-colors"
            style={{
              background: category === c ? "rgba(0,212,255,0.15)" : "transparent",
              color: category === c ? "hsl(185,100%,55%)" : "hsl(185,40%,45%)",
              fontSize: "0.55rem",
              letterSpacing: "0.06em",
              border: category === c ? "1px solid rgba(0,212,255,0.25)" : "1px solid transparent",
            }}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
        {filtered.map((app) => (
          <button
            key={app.id}
            onClick={() => handleOpen(app.id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-all hover:bg-cyan-500/10"
            style={{ border: "1px solid transparent" }}
          >
            <span style={{ fontSize: "1.1rem", width: "20px", textAlign: "center" }}>{app.icon}</span>
            <div className="flex-1 min-w-0">
              <div style={{ color: "hsl(185,80%,70%)", fontSize: "0.7rem", fontWeight: "bold" }}>{app.name}</div>
              <div style={{ color: "hsl(185,40%,45%)", fontSize: "0.6rem" }}>{app.description}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-4" style={{ color: "hsl(185,40%,40%)", fontSize: "0.65rem" }}>
            No apps found
          </div>
        )}
      </div>

      <div className="px-3 py-2 flex justify-between items-center" style={{ borderTop: "1px solid rgba(0,212,255,0.1)" }}>
        <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.55rem" }}>QUANTUM SECURE SESSION</span>
        <button
          className="px-2 py-1 rounded text-xs"
          style={{
            background: "rgba(255,0,64,0.1)",
            color: "hsl(0,100%,55%)",
            border: "1px solid rgba(255,0,64,0.2)",
            fontSize: "0.55rem",
          }}
        >
          SHUTDOWN
        </button>
      </div>
    </div>
  );
}
