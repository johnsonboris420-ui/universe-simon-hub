import { useWallet, apiFor, useConfig } from "@/lib/wallet";
import { WalletPicker } from "@/components/WalletPicker";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shortenAddress } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Filter, Download, Pickaxe } from "lucide-react";
import { motion } from "framer-motion";

function getApiUrl(path: string) {
  return `/api${path}`;
}

const ETHERSCAN_BASE = "https://etherscan.io";
const BSCSCAN_BASE = "https://bscscan.com";

interface DisplayTransaction {
  id: number;
  hash: string;
  chainName: string;
  status: string;
  action: string;
  token: string;
  from: string;
  fromInfo: string;
  to: string;
  toInfo: string;
  amount: string;
  fee: string;
  block: string;
  createdAt: string;
  ethReward?: string;
}

function toDisplayTx(txn: Record<string, unknown>): DisplayTransaction {
  return {
    id: Number(txn.id ?? 0),
    hash: String(txn.hash ?? ""),
    chainName: String(txn.chainName ?? "BSC"),
    status: String(txn.status ?? ""),
    action: String(txn.action ?? ""),
    token: String(txn.token ?? ""),
    from: String(txn.from ?? ""),
    fromInfo: String(txn.fromInfo ?? ""),
    to: String(txn.to ?? ""),
    toInfo: String(txn.toInfo ?? ""),
    amount: String(txn.amount ?? ""),
    fee: String(txn.fee ?? ""),
    block: String(txn.block ?? ""),
    createdAt: String(txn.createdAt ?? ""),
    ethReward: txn.ethReward ? String(txn.ethReward) : undefined,
  };
}

export default function TransactionsPage() {
  const wallet = useWallet();
  const { data: apiTxns, isLoading, error } = useQuery<Record<string, unknown>[]>({
    queryKey: ["transactions", wallet], enabled: !!wallet, retry: 1, staleTime: 60000,
    queryFn: async () => { const r = await fetch(apiFor("/transactions", wallet)); if (!r.ok) throw new Error((await r.json()).error); return r.json(); },
  });

  const transactions: DisplayTransaction[] = (apiTxns ?? []).map((t) => toDisplayTx(t));

  const getActionBadge = (action: string) => {
    switch(action.toLowerCase()) {
      case 'transfer': return <Badge variant="info">{action}</Badge>;
      case 'swap': return <Badge variant="warning">{action}</Badge>;
      case 'multicall': return <Badge variant="default">{action}</Badge>;
      case 'approve': return <Badge variant="outline">{action}</Badge>;
      case 'mine': return (
        <Badge variant="success" className="flex items-center gap-1">
          <Pickaxe className="w-3 h-3" />
          {action}
        </Badge>
      );
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status.toLowerCase() === 'success') return <Badge variant="success">Success</Badge>;
    if (status.toLowerCase() === 'failed') return <Badge variant="danger">Failed</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-in">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Transaction History</h1>
            <p className="text-muted-foreground mt-1">Live Ethereum transactions for this wallet (via eth.blockscout.com, read-only)</p>
            {error && <p className="text-red-400 text-sm mt-2">Couldn't load live transactions: {String((error as Error).message ?? error)}</p>}
            {!wallet && <div className="mt-3"><WalletPicker compact /></div>}
            {wallet && !error && transactions.length === 0 && <p className="text-muted-foreground text-sm mt-2">No transactions found.</p>}
          </div>
          
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              Filter
            </button>
            <button className="flex items-center px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-black/10">
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Hash</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Chain</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Method</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">From</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Amount</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {transactions.map((txn, i) => {
                    const explorerBase = txn.chainName === "ETH" ? ETHERSCAN_BASE : BSCSCAN_BASE;
                    const explorerUrl = `${explorerBase}/tx/${txn.hash}`;
                    const isRealHash = txn.hash.length === 66;
                    const isMine = txn.action === "Mine";
                    const isReceive = txn.action === "Receive" || txn.toInfo === "My Wallet" || isMine;
                    return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      key={txn.id} 
                      className={`hover:bg-white/[0.02] transition-colors ${isMine ? "border-l-2 border-orange-500/40" : ""}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-primary font-mono text-sm">{shortenAddress(txn.hash)}</span>
                          {isRealHash ? (
                            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors p-1" title="View on Explorer">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <button className="text-muted-foreground hover:text-foreground transition-colors p-1 opacity-40" disabled>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {txn.block && <p className="text-[10px] text-muted-foreground mt-0.5">Block #{txn.block}</p>}
                      </td>
                      <td className="py-4 px-6">
                        <Badge 
                          variant={
                            txn.chainName === "ETH" ? "info" 
                            : txn.chainName === "BTC" ? "warning" 
                            : "warning"
                          } 
                          className="text-[10px]"
                        >
                          {txn.chainName || "BSC"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        {getActionBadge(txn.action)}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-foreground">{format(new Date(txn.createdAt), "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(txn.createdAt), "HH:mm:ss")}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-foreground">{shortenAddress(txn.from)}</span>
                          </div>
                          {txn.fromInfo && <p className="text-[10px] text-muted-foreground">{txn.fromInfo}</p>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {txn.amount ? (
                          <span className={`font-mono text-sm font-semibold ${isReceive ? "text-green-400" : "text-red-400"}`}>
                            {txn.amount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                        {txn.fee && <p className="text-[10px] text-muted-foreground mt-0.5">Fee: {txn.fee}</p>}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(txn.status)}
                      </td>
                    </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
