import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ background: "hsl(220, 60%, 4%)" }}>
      <div className="scan-overlay" />
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
