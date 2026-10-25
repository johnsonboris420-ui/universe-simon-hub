import { short, useWallet, setWatchAddress } from "@/lib/wallet";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  ListTree, 
  Wallet,
  Bell,
  Search,
  LogOut,
  Hexagon,
  Sparkles,
  Pickaxe,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const wallet = useWallet();

  const navItems = [
    { name: "Hub", path: "/hub", icon: LayoutGrid },
    { name: "Portfolio", path: "/", icon: LayoutDashboard },
    { name: "Transactions", path: "/transactions", icon: ArrowRightLeft },
    { name: "Token Transfers", path: "/transfers", icon: ListTree },
    { name: "4D Mandelbulb", path: "/mandelbulb", icon: Sparkles },
    { name: "Mining (Simulation)", path: "/mining", icon: Pickaxe },
    { name: "Learn to Earn", path: "/earn", icon: Sparkles },
    { name: "S67M Perks", path: "/perks", icon: Sparkles },
    { name: "About S67M", path: "/about-s67m", icon: Sparkles },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/30 flex flex-col backdrop-blur-xl">
        <div className="h-20 flex items-center px-6 border-b border-border/50">
          <Hexagon className="w-8 h-8 text-primary fill-primary/20 mr-3" />
          <span className="font-display font-bold text-xl tracking-wide text-foreground">
            Block<span className="text-primary">Scan</span>
          </span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mr-3 transition-colors duration-300",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,163,255,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border/50">
          <div className="glass-panel p-4 rounded-xl flex items-center">
            <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">0x</div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold truncate text-foreground font-mono">{short(wallet)}</p>
              <p className="text-xs text-muted-foreground truncate">Watch-only wallet{wallet && <button onClick={() => setWatchAddress(null)} className="ml-2 text-primary">change</button>}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 border-b border-border/50 bg-background/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search addresses, txn hash, blocks..." 
                className="w-full bg-black/20 border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-black/20 border border-border/50 rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-xs font-medium text-muted-foreground">Ethereum + BNB Chain · read-only</span>
            </div>
            
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              <Wallet className="w-4 h-4" />
            </button>
            
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-background"></span>
            </button>
            
            <div className="w-px h-6 bg-border/50 mx-2"></div>
            
            <button className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
