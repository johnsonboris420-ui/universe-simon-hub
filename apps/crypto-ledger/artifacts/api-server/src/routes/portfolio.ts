import { Router, type IRouter } from "express";
import { getLivePortfolio, resolveAddress } from "../lib/live";
const NO_WALLET = { error: "No wallet configured", detail: "Set WALLET_ADDRESS on the server or pass ?address=0x... (read-only)." };
import { getHistory, recordSnapshot } from "../lib/snapshots";

const router: IRouter = Router();

router.get("/portfolio", async (req, res) => {
  try {
    const addr = resolveAddress(req.query.address);
    if (!addr) { res.status(400).json(NO_WALLET); return; }
    const p = await getLivePortfolio(addr);
    recordSnapshot(p).catch(err => req.log.warn({ err }, "snapshot failed"));
    res.json(p);
  } catch (err) {
    req.log.error({ err }, "Failed to get live portfolio");
    res.status(502).json({ error: "Could not fetch live wallet data", detail: (err as Error).message });
  }
});

router.get("/portfolio/history", async (req, res) => {
  const addr = resolveAddress(req.query.address);
  if (!addr) { res.status(400).json(NO_WALLET); return; }
  try { res.json(await getHistory(addr)); }
  catch (err) { req.log.error({ err }, "history failed"); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
