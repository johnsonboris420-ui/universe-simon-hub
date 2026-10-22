import { pool } from "@workspace/db";
import { logger } from "./logger";
import { getLivePortfolio, DEFAULT_WALLET } from "./live";

let ready: Promise<void> | null = null;
function ensure() {
  ready ??= pool.query(`CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id serial PRIMARY KEY, taken_at timestamptz NOT NULL DEFAULT now(),
    total_usd double precision NOT NULL, holdings jsonb NOT NULL)`)
    .then(() => pool.query(`ALTER TABLE portfolio_snapshots ADD COLUMN IF NOT EXISTS address text`)).then(() => undefined);
  return ready;
}

const lastAt = new Map<string, number>();
export async function recordSnapshot(p: Awaited<ReturnType<typeof getLivePortfolio>>, minGapMs = 4 * 60_000) {
  const key = p.wallet.toLowerCase();
  if (p.errors.length || Date.now() - (lastAt.get(key) ?? 0) < minGapMs) return; // only record complete data
  await ensure();
  lastAt.set(key, Date.now());
  const h = p.holdings.filter(x => x.priced).map(x => ({ s: x.symbol, c: x.chain, a: x.amount, v: x.valueUsd }));
  await pool.query("INSERT INTO portfolio_snapshots (total_usd, holdings, address) VALUES ($1, $2, $3)", [p.totalValueUsd, JSON.stringify(h), key]);
}

export async function getHistory(address: string, limit = 2000) {
  await ensure();
  const r = await pool.query("SELECT taken_at, total_usd, holdings FROM portfolio_snapshots WHERE address = $1 OR address IS NULL AND $1 = $3 ORDER BY taken_at DESC LIMIT $2", [address.toLowerCase(), limit, (DEFAULT_WALLET ?? "").toLowerCase()]);
  return r.rows.reverse().map(x => ({ at: x.taken_at, totalUsd: x.total_usd, holdings: x.holdings }));
}

export function startSnapshotter(everyMs = 5 * 60_000) {
  const w = DEFAULT_WALLET;
  if (!w) { logger.info("No WALLET_ADDRESS set; background snapshots disabled"); return; }
  const tick = () => getLivePortfolio(w).then(p => recordSnapshot(p, 0)).catch(err => logger.warn({ err }, "snapshot failed"));
  tick();
  setInterval(tick, everyMs);
}
