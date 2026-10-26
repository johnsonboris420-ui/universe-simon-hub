import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import PortfolioPage from "@/pages/portfolio";
import TransactionsPage from "@/pages/transactions";
import TokenTransfersPage from "@/pages/token-transfers";
import MandelbulbPage from "@/pages/mandelbulb";
import MiningPage from "@/pages/mining";
import NotFound from "@/pages/not-found";
import AssetPage from "@/pages/asset";
import HubPage from "@/pages/hub";
import EarnPage from "@/pages/earn";
import PerksPage from "@/pages/perks";
import AboutS67M from "@/pages/about-s67m";
import XmrMinePage from "@/pages/xmr-mine";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={PortfolioPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/transfers" component={TokenTransfersPage} />
      <Route path="/mandelbulb" component={MandelbulbPage} />
      <Route path="/mining" component={MiningPage} />
      <Route path="/asset/:chain/:id" component={AssetPage} />
      <Route path="/hub" component={HubPage} />
      <Route path="/earn" component={EarnPage} />
      <Route path="/perks" component={PerksPage} />
      <Route path="/about-s67m" component={AboutS67M} />
      <Route path="/xmr-mine" component={XmrMinePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
