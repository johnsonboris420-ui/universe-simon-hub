import { Router, type IRouter } from "express";
import { db, tokenTransfersTable } from "@workspace/db";
import { getLiveTokenTransfers, parseEtherscanCsv, resolveAddress } from "../lib/live";

const router: IRouter = Router();

router.get("/token-transfers", async (req, res) => {
  const addr = resolveAddress(req.query.address);
  if (!addr) { res.status(400).json({ error: "No wallet configured" }); return; }
  let live: any[] = [];
  let liveError: string | null = null;
  try { live = await getLiveTokenTransfers(addr); } catch (e) { liveError = (e as Error).message; }
  try {
    const imported = (await db.select().from(tokenTransfersTable).orderBy(tokenTransfersTable.id)).map(t => ({ ...t, source: "csv" }));
    const liveKeys = new Set(live.map(t => `${t.hash}|${t.token}`.toLowerCase()));
    const merged = [...live, ...imported.filter(t => !liveKeys.has(`${t.hash}|${t.token}`.toLowerCase()))]
      .sort((a, b) => String(a.dateTime).localeCompare(String(b.dateTime)));
    // Flag outgoing transfers to an address this wallet had never interacted with before (chronological scan).
    const me = addr.toLowerCase();
    const seen = new Set<string>();
    for (const t of merged as any[]) {
      const from = String(t.from).toLowerCase(), to = String(t.to).toLowerCase();
      t.direction = from === me ? "out" : to === me ? "in" : "other";
      t.newCounterparty = t.direction === "out" && !seen.has(to);
      seen.add(from); seen.add(to);
    }
    merged.reverse();
    if (liveError) res.setHeader("X-Live-Error", liveError.slice(0, 200));
    res.json(merged);
  } catch (err) {
    req.log.error({ err }, "Failed to get token transfers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Import an Etherscan-style token-transfer CSV (body: raw CSV text). Replaces previous imports when ?replace=1.
const importsEnabled = () => process.env.ALLOW_CSV_IMPORT !== "false";

router.post("/token-transfers/import", async (req, res) => {
  if (!importsEnabled()) { res.status(403).json({ error: "CSV import disabled on this server" }); return; }
  try {
    const text = typeof req.body === "string" ? req.body : req.body?.csv;
    if (!text) { res.status(400).json({ error: "Send CSV text as body (Content-Type: text/csv)" }); return; }
    const rows = parseEtherscanCsv(text);
    if (req.query.replace === "1") await db.delete(tokenTransfersTable);
    const existing = new Set((await db.select().from(tokenTransfersTable)).map(t => `${t.hash}|${t.token}|${t.amount}`));
    const fresh = rows.filter(r => !existing.has(`${r.hash}|${r.token}|${r.amount}`));
    if (fresh.length) await db.insert(tokenTransfersTable).values(fresh);
    res.json({ parsed: rows.length, inserted: fresh.length, skippedDuplicates: rows.length - fresh.length });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/token-transfers/import", async (_req, res) => {
  if (!importsEnabled()) { res.status(403).json({ error: "CSV import disabled on this server" }); return; }
  await db.delete(tokenTransfersTable);
  res.json({ ok: true });
});

export default router;
