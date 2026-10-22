// Read-only live wallet data from keyless public sources. Never signs or sends anything.
// Which wallet to watch: WALLET_ADDRESS env var, or ?address= on each request. No default (public-safe).
export const DEFAULT_WALLET = process.env.WALLET_ADDRESS?.trim() || null;
export function resolveAddress(q: unknown): string | null {
  const a = typeof q === "string" && q ? q.trim() : DEFAULT_WALLET;
  return a && /^0x[0-9a-fA-F]{40}$/.test(a) ? a : null;
}

const ETH_RPC = process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const BSC_RPC = process.env.BSC_RPC_URL ?? "https://bsc-rpc.publicnode.com";
const BLOCKSCOUT = "https://eth.blockscout.com/api/v2";
const COINGECKO = "https://api.coingecko.com/api/v3";

const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  try {
    const value = await fn();
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch (e) {
    if (hit) return hit.value as T; // stale fallback
    throw e;
  }
}

async function getJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000), headers: { accept: "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`${url.split("?")[0]} -> HTTP ${res.status}`);
  return res.json();
}

async function rpc(url: string, method: string, params: unknown[]): Promise<string> {
  const j = await getJson(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}

const toUnits = (hex: string, decimals: number) => {
  if (!hex || hex === "0x") return 0;
  const v = BigInt(hex);
  const d = 10n ** BigInt(decimals);
  return Number(v / d) + Number(v % d) / Number(d);
};

async function erc20Balance(url: string, token: string, decimals: number, WALLET: string) {
  const data = "0x70a08231" + WALLET.slice(2).toLowerCase().padStart(64, "0");
  return toUnits(await rpc(url, "eth_call", [{ to: token, data }, "latest"]), decimals);
}

// Known BNB Smart Chain tokens (official BEP-20 contracts) + CoinGecko ids
const BSC_TOKENS = [
  { symbol: "VINU", name: "Vita Inu", address: "0xfEbe8C1eD424DbF688551D4E2267e7A53698F0aa", decimals: 18, cg: "vita-inu" },
  { symbol: "USDT", name: "Tether USD", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, cg: "tether" },
  { symbol: "DOGE", name: "Dogecoin (BEP-20)", address: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", decimals: 8, cg: "dogecoin" },
  { symbol: "CAKE", name: "PancakeSwap", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", decimals: 18, cg: "pancakeswap-token" },
  { symbol: "BTT", name: "BitTorrent", address: "0x352Cb5E19b12FC216548a2677bD0fce83BaE434B", decimals: 18, cg: "bittorrent" },
  { symbol: "BUSD", name: "Binance USD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18, cg: "binance-usd" },
  { symbol: "ADA", name: "Cardano (BEP-20)", address: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47", decimals: 18, cg: "cardano" },
  { symbol: "APE", name: "ApeCoin (BEP-20)", address: "0xC762043E211571eB34f1ef377e5e8e76914962f9", decimals: 18, cg: "apecoin" },
];

type Price = { usd: number; usd_24h_change?: number };
async function prices(ids: string[]): Promise<Record<string, Price>> {
  const key = "cg:" + [...ids].sort().join(",");
  return cached(key, 120_000, () => getJson(`${COINGECKO}/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`));
}

export interface Holding { symbol: string; name: string; amount: number; valueUsd: number; priceUsd: number; change24hPercent: number; chain: string; priced: boolean; contract?: string }

export async function getLivePortfolio(WALLET: string) {
  return cached("portfolio:" + WALLET.toLowerCase(), 60_000, async () => {
    const errors: string[] = [];
    const ids = ["ethereum", "binancecoin", ...BSC_TOKENS.map(t => t.cg)];
    let px: Record<string, Price> = {};
    try { px = await prices(ids); } catch (e) { errors.push(`Prices (CoinGecko): ${(e as Error).message}`); }
    const p = (id: string) => px[id];
    const holdings: Holding[] = [];
    const add = (h: Omit<Holding, "valueUsd" | "priceUsd" | "change24hPercent" | "priced">, price?: Price) => {
      holdings.push({ ...h, priceUsd: price?.usd ?? 0, valueUsd: price ? h.amount * price.usd : 0, change24hPercent: price?.usd_24h_change ?? 0, priced: !!price });
    };

    await Promise.all([
      rpc(ETH_RPC, "eth_getBalance", [WALLET, "latest"]).then(b => add({ symbol: "ETH", name: "Ether", amount: toUnits(b, 18), chain: "Ethereum" }, p("ethereum")))
        .catch(e => errors.push(`Ethereum RPC: ${e.message}`)),
      rpc(BSC_RPC, "eth_getBalance", [WALLET, "latest"]).then(b => add({ symbol: "BNB", name: "BNB", amount: toUnits(b, 18), chain: "BNB Smart Chain" }, p("binancecoin")))
        .catch(e => errors.push(`BNB Chain RPC: ${e.message}`)),
      ...BSC_TOKENS.map(t => erc20Balance(BSC_RPC, t.address, t.decimals, WALLET)
        .then(a => { if (a > 0) add({ symbol: t.symbol, name: t.name, amount: a, chain: "BNB Smart Chain", contract: t.address }, p(t.cg)); })
        .catch(e => errors.push(`BSC ${t.symbol}: ${e.message}`))),
      getJson(`${BLOCKSCOUT}/addresses/${WALLET}/token-balances`).then((items: any[]) => {
        for (const it of items) {
          const tk = it.token; if (tk.type !== "ERC-20") continue;
          const amount = toUnits("0x" + BigInt(it.value).toString(16), Number(tk.decimals ?? 18));
          if (amount <= 0) continue;
          const rate = tk.exchange_rate ? Number(tk.exchange_rate) : undefined;
          add({ symbol: tk.symbol ?? "?", name: tk.name ?? "Unknown token", amount, chain: "Ethereum", contract: tk.address_hash }, rate !== undefined ? { usd: rate } : undefined);
        }
      }).catch(e => errors.push(`Ethereum tokens (Blockscout): ${e.message}`)),
    ]);

    holdings.sort((a, b) => (Number(b.priced) - Number(a.priced)) || b.valueUsd - a.valueUsd);
    const totalValueUsd = holdings.reduce((s, h) => s + h.valueUsd, 0);
    const change24h = holdings.reduce((s, h) => s + (h.valueUsd - h.valueUsd / (1 + h.change24hPercent / 100)), 0);
    return {
      wallet: WALLET, totalValueUsd, change24h,
      change24hPercent: totalValueUsd ? (change24h / (totalValueUsd - change24h)) * 100 : 0,
      holdings, errors, fetchedAt: new Date().toISOString(),
      sources: ["publicnode.com RPC (Ethereum, BNB Chain)", "eth.blockscout.com", "CoinGecko simple/price"],
    };
  });
}

const fmtDate = (iso: string) => iso.replace("T", " ").replace(/\.\d+Z$|Z$/, "");

export async function getLiveTokenTransfers(WALLET: string) {
  return cached("transfers:" + WALLET.toLowerCase(), 60_000, async () => {
    const j = await getJson(`${BLOCKSCOUT}/addresses/${WALLET}/token-transfers`);
    return (j.items as any[]).map((t, i) => {
      const dec = Number(t.total?.decimals ?? t.token?.decimals ?? 18);
      const amt = t.total?.value ? toUnits("0x" + BigInt(t.total.value).toString(16), dec) : 0;
      const rate = t.token?.exchange_rate ? Number(t.token.exchange_rate) : null;
      return {
        id: -(i + 1), hash: t.transaction_hash, status: "Success", method: t.method ?? t.type ?? "",
        blockNo: t.block_number, dateTime: fmtDate(t.timestamp), from: t.from.hash, fromNametag: t.from.name ?? "",
        to: t.to.hash, toNametag: t.to.name ?? "", amount: amt.toLocaleString("en-US", { maximumFractionDigits: 8 }),
        valueUsd: rate != null ? `$${(amt * rate).toFixed(2)}` : "", token: `${t.token?.name ?? "?"} (${t.token?.symbol ?? "?"})`,
        source: "live",
      };
    });
  });
}

export async function getLiveTransactions(WALLET: string) {
  return cached("txs:" + WALLET.toLowerCase(), 60_000, async () => {
    const j = await getJson(`${BLOCKSCOUT}/addresses/${WALLET}/transactions`);
    return (j.items as any[]).map((t, i) => ({
      id: -(i + 1), hash: t.hash, chainName: "Ethereum", status: t.status === "ok" ? "Success" : (t.status ?? "Pending"),
      action: t.method ?? (t.transaction_types?.[0] ?? "Transfer"),
      token: t.value && t.value !== "0" ? "ETH" : "",
      amount: t.value && t.value !== "0" ? `${t.from?.hash?.toLowerCase() === WALLET.toLowerCase() ? "-" : "+"}${toUnits("0x" + BigInt(t.value).toString(16), 18)} ETH` : "",
      fee: t.fee?.value ? `${toUnits("0x" + BigInt(t.fee.value).toString(16), 18).toFixed(8)} ETH` : "",
      block: String(t.block_number ?? t.block ?? ""),
      from: t.from?.hash ?? "", fromInfo: t.from?.name ?? "Address", to: t.to?.hash ?? "", toInfo: t.to?.name ?? "Address",
      createdAt: t.timestamp,
    }));
  });
}

// Etherscan-style token transfer CSV parser
export function parseEtherscanCsv(text: string) {
  const rows: string[][] = [];
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells: string[] = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ",") { cells.push(cur); cur = ""; } else cur += c;
    }
    cells.push(cur); rows.push(cells);
  }
  if (rows.length < 2) throw new Error("CSV has no data rows");
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = (...names: string[]) => { const i = header.findIndex(h => names.some(n => h.startsWith(n))); return i; };
  const ix = { hash: col("transaction hash", "txhash"), status: col("status"), method: col("method"), block: col("blockno", "blockno", "block"),
    date: col("datetime", "date"), from: col("from"), fromTag: col("from_nametag"), to: col("to"), toTag: col("to_nametag"),
    amount: col("amount", "quantity", "tokenvalue"), usd: col("value (usd)", "usdvalue"), token: col("token", "tokenname", "tokensymbol") };
  // "from"/"to" startsWith would also match nametag columns; force exact ones
  ix.from = header.indexOf("from"); ix.to = header.indexOf("to");
  for (const k of ["hash", "from", "to", "amount", "token"] as const) if (ix[k] < 0) throw new Error(`CSV missing column for "${k}". Expected Etherscan token-transfer export.`);
  return rows.slice(1).filter(r => r.length >= header.length - 1).map(r => ({
    hash: r[ix.hash], status: ix.status >= 0 ? r[ix.status] : "Success", method: ix.method >= 0 ? r[ix.method] : "",
    blockNo: ix.block >= 0 ? parseInt(r[ix.block], 10) || 0 : 0, dateTime: ix.date >= 0 ? r[ix.date] : "",
    from: r[ix.from], fromNametag: ix.fromTag >= 0 ? r[ix.fromTag] : "", to: r[ix.to], toNametag: ix.toTag >= 0 ? r[ix.toTag] : "",
    amount: r[ix.amount], valueUsd: ix.usd >= 0 ? r[ix.usd] : "", token: r[ix.token],
  }));
}
