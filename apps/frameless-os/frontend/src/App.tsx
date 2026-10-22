import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Boot from "@/pages/boot";
import { Desktop } from "@/components/desktop/Desktop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 30000,
      retry: 1,
    },
  },
});

function App() {
  const [phase, setPhase] = useState<"boot" | "desktop">("boot");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen overflow-hidden" style={{ background: "hsl(220,70%,3%)" }}>
        {phase === "boot" && (
          <Boot onBootComplete={() => setPhase("desktop")} />
        )}
        {phase === "desktop" && (
          <Desktop />
        )}
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
