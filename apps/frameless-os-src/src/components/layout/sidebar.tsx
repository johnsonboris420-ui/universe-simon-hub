import { useLocation } from "wouter";

const navItems = [
  { path: "/dashboard", label: "DASHBOARD", icon: "⬡" },
  { path: "/threats", label: "THREAT FEED", icon: "⚠" },
  { path: "/agents", label: "AI AGENTS", icon: "◈" },
  { path: "/nodes", label: "NETWORK", icon: "⬟" },
  { path: "/protection", label: "CHILD GUARD", icon: "⛨" },
  { path: "/healing", label: "SELF-HEAL", icon: "⟳" },
  { path: "/platforms", label: "PLATFORMS", icon: "▣" },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();

  return (
    <aside className="w-56 min-h-screen flex flex-col" style={{
      background: "hsl(220, 60%, 5%)",
      borderRight: "1px solid rgba(0, 212, 255, 0.15)",
    }}>
      <div className="p-4 border-b" style={{ borderColor: "rgba(0, 212, 255, 0.15)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, hsl(185,100%,50%), hsl(220,100%,60%))",
              color: "hsl(220,60%,4%)",
              boxShadow: "0 0 12px rgba(0,212,255,0.5)",
            }}>
            F
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest" style={{ color: "hsl(185,100%,50%)", textShadow: "0 0 8px rgba(0,212,255,0.6)" }}>
              FRAMELESS
            </div>
            <div className="text-xs" style={{ color: "hsl(185,60%,50%)", fontSize: "0.6rem", letterSpacing: "0.15em" }}>
              OS v2.4.1
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 py-3 flex-1">
        <div className="text-xs mb-3 px-2" style={{ color: "hsl(185,40%,40%)", letterSpacing: "0.2em", fontSize: "0.6rem" }}>
          MISSION CONTROL
        </div>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.path || (location === "/" && item.path === "/dashboard");
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-150"
                style={{
                  background: isActive ? "rgba(0, 212, 255, 0.12)" : "transparent",
                  borderLeft: isActive ? "2px solid hsl(185,100%,50%)" : "2px solid transparent",
                  color: isActive ? "hsl(185,100%,50%)" : "hsl(185,60%,55%)",
                  textShadow: isActive ? "0 0 8px rgba(0,212,255,0.5)" : "none",
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                }}
              >
                <span style={{ fontSize: "0.9rem", width: "16px", textAlign: "center" }}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t" style={{ borderColor: "rgba(0, 212, 255, 0.1)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(140,100%,50%)", boxShadow: "0 0 6px hsl(140,100%,50%)" }} />
          <span className="text-xs" style={{ color: "hsl(185,60%,45%)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
            ALL SYSTEMS NOMINAL
          </span>
        </div>
        <div className="mt-1 text-xs" style={{ color: "hsl(185,40%,35%)", fontSize: "0.55rem", letterSpacing: "0.08em" }}>
          UPTIME: 99.9997%
        </div>
      </div>
    </aside>
  );
}
