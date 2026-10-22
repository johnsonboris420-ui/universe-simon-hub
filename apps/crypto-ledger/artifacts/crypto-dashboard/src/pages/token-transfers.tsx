import { useWallet, apiFor, useConfig } from "@/lib/wallet";
import { WalletPicker } from "@/components/WalletPicker";
import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd, formatCrypto, shortenAddress } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, ArrowRight, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";

type Transfer = { id: number; hash: string; status: string; method: string; blockNo: number; dateTime: string; from: string; fromNametag: string; to: string; toNametag: string; amount: string; valueUsd: string; token: string; source?: string; direction?: string; newCounterparty?: boolean };

export default function TokenTransfersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const qc = useQueryClient();
  const wallet = useWallet();
  const { data: cfg } = useConfig();
  const WALLET = (wallet ?? "").toLowerCase();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const { data: apiTransfers, isLoading, error } = useQuery<Transfer[]>({
    queryKey: ["token-transfers-live", wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const res = await fetch(apiFor("/token-transfers", wallet));
      if (!res.ok) throw new Error("Failed to load transfers");
      return res.json();
    },
    refetchInterval: 60000,
  });
  const allTransfers = apiTransfers ?? [];

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await fetch("/api/token-transfers/import", { method: "POST", headers: { "content-type": "text/csv" }, body: await file.text() });
      const body = await res.json();
      setImportMsg(res.ok ? `Imported ${body.inserted} of ${body.parsed} rows from ${file.name} (${body.skippedDuplicates} duplicates skipped)` : `Import failed: ${body.error}`);
      qc.invalidateQueries({ queryKey: ["token-transfers-live", wallet] });
    } catch (err) {
      setImportMsg(`Import failed: ${(err as Error).message}`);
    }
    e.target.value = "";
  }
  
  const filteredTransfers = allTransfers.filter(t => 
    t.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.hash.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-3xl font-display font-bold text-foreground">Token Transfers</h1>
            <p className="text-muted-foreground mt-1">Live ERC-20 transfers on Ethereum (eth.blockscout.com) plus rows imported from Etherscan CSV exports</p>
            {error && <p className="text-red-400 text-sm mt-2">Couldn't load transfers: {(error as Error).message}</p>}
            {!wallet && <div className="mt-3"><WalletPicker compact /></div>}
            {importMsg && <p className="text-sm mt-2 text-primary">{importMsg}</p>}
          </div>
          
          {cfg?.csvImport !== false && <label className="cursor-pointer px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 whitespace-nowrap">
            Import Etherscan CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onImport} />
          </label>}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tokens or hashes..." 
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-foreground"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-black/10">
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Txn Hash</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Age</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Transfer Path</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Amount</th>
                    <th className="py-4 px-6 text-xs font-semibold text-muted-foreground tracking-wider uppercase text-right">Token</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredTransfers.length > 0 ? filteredTransfers.map((transfer, i) => {
                    const isOut = transfer.from.toLowerCase() === WALLET;
                    
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={transfer.id} 
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="text-primary font-mono text-sm">{shortenAddress(transfer.hash)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-foreground">{format(new Date(transfer.dateTime), "MMM d")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(transfer.dateTime), "HH:mm")}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{transfer.fromNametag || shortenAddress(transfer.from)}</span>
                              <span className="text-xs text-muted-foreground font-mono">{shortenAddress(transfer.from)}</span>
                            </div>
                            <div className={`p-1.5 rounded-full ${isOut ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{transfer.toNametag || shortenAddress(transfer.to)}</span>
                              <span className="text-xs text-muted-foreground font-mono">{shortenAddress(transfer.to)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className={`font-semibold text-sm ${isOut ? 'text-foreground' : 'text-green-400'}`}>
                            {isOut ? '-' : '+'}{transfer.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">{transfer.valueUsd || "no price"}{transfer.source === "csv" && <span className="ml-1 text-[10px] text-yellow-400">CSV</span>}{transfer.newCounterparty && <span className="ml-1 text-[10px] px-1 rounded bg-red-500/20 text-red-300" title="First ever outgoing transfer to this address. Double-check it was you.">⚠ new address</span>}</p>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Badge variant="outline" className="bg-card shadow-sm border-border/50">
                            {transfer.token}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <ArrowRightLeft className="w-12 h-12 text-muted-foreground/30 mb-3" />
                          <p>No token transfers found matching your search.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
