import { useState } from "react";
import { isAddress, setWatchAddress } from "@/lib/wallet";

export function WalletPicker({ compact = false }: { compact?: boolean }) {
  const [v, setV] = useState("");
  const ok = isAddress(v);
  return (
    <form className={compact ? "flex gap-2" : "flex flex-col sm:flex-row gap-3 w-full max-w-xl"} onSubmit={e => { e.preventDefault(); if (ok) setWatchAddress(v); }}>
      <input value={v} onChange={e => setV(e.target.value)} placeholder="0x… public wallet address (read-only)"
        className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50" />
      <button disabled={!ok} className="px-4 py-2.5 rounded-xl bg-primary/20 text-primary text-sm font-medium disabled:opacity-40">Watch</button>
    </form>
  );
}
