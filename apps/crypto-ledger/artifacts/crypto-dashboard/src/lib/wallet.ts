// Which wallet the dashboard watches (read-only). Priority: ?address= in URL, saved choice, server default.
import { useQuery } from "@tanstack/react-query";

export type AppConfig = { defaultWallet: string | null; csvImport: boolean; learnchainUrl: string; readOnly: boolean };
const KEY = "watchAddress";
export const isAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a.trim());

export function useConfig() {
  return useQuery<AppConfig>({ queryKey: ["config"], queryFn: async () => (await fetch("/api/config")).json(), staleTime: Infinity });
}

export function useWallet(): string | null {
  const { data } = useConfig();
  const fromUrl = new URLSearchParams(window.location.search).get("address");
  if (fromUrl && isAddress(fromUrl)) { localStorage.setItem(KEY, fromUrl); return fromUrl; }
  const saved = localStorage.getItem(KEY);
  if (saved && isAddress(saved)) return saved;
  return data?.defaultWallet ?? null;
}

export function setWatchAddress(a: string | null) {
  if (a) localStorage.setItem(KEY, a.trim()); else localStorage.removeItem(KEY);
  const u = new URL(window.location.href); u.searchParams.delete("address");
  window.location.href = u.toString();
}

export const apiFor = (path: string, address: string | null) =>
  `/api${path}${address ? `${path.includes("?") ? "&" : "?"}address=${address}` : ""}`;

export const short = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "none");
