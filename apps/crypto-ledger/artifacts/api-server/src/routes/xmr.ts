import { Router, type IRouter } from "express";

// Public MoneroOcean + price stats for the opt-in browser mining page. This server never mines.
const router: IRouter = Router();
let cache: { at: number; body: any } | null = null;
const get = async (u: string) => (await fetch(u, { signal: AbortSignal.timeout(8000) })).json() as Promise<any>;

router.get("/xmr/stats", async (req, res) => {
  try {
    if (!cache || Date.now() - cache.at > 5 * 60_000) {
      const [net, pool, price] = await Promise.all([
        get("https://api.moneroocean.stream/network/stats").catch(() => null),
        get("https://api.moneroocean.stream/pool/stats").catch(() => null),
        get("https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd,gbp").catch(() => null),
      ]);
      const x = net?.["18081"];
      const difficulty = Number(x?.difficulty) || null;
      const reward = x?.value ? Number(x.value) / 1e12 : null;
      cache = { at: Date.now(), body: {
        difficulty, blockReward: reward,
        xmrPerHashPerDay: difficulty && reward ? (86400 * reward) / difficulty : null,
        poolHashrate: Number(pool?.pool_statistics?.hashRate) || null, poolMiners: Number(pool?.pool_statistics?.miners) || null,
        priceUsd: price?.monero?.usd ?? null, priceGbp: price?.monero?.gbp ?? null,
        relayConfigured: !!process.env.XMR_RELAY_URL?.trim(), relayUrl: process.env.XMR_RELAY_URL?.trim() || null,
        source: "api.moneroocean.stream + CoinGecko", fetchedAt: new Date().toISOString(),
      } };
    }
    res.json(cache.body);
  } catch (err) { req.log.error({ err }, "xmr stats failed"); res.status(502).json({ error: "Stats unavailable" }); }
});
export default router;
