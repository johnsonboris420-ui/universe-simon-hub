import { Router, type IRouter } from "express";
import { getLiveTransactions, resolveAddress } from "../lib/live";

const router: IRouter = Router();

router.get("/transactions", async (req, res) => {
  try {
    const addr = resolveAddress(req.query.address);
    if (!addr) { res.status(400).json({ error: "No wallet configured" }); return; }
    res.json(await getLiveTransactions(addr));
  } catch (err) {
    req.log.error({ err }, "Failed to get live transactions");
    res.status(502).json({ error: "Could not fetch live transactions", detail: (err as Error).message });
  }
});

export default router;
