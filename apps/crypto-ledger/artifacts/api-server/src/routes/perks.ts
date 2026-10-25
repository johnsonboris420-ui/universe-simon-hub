import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { pool } from "@workspace/db";
import { isAddress, getAddress, verifyMessage, erc20Abi } from "viem";
import { publicClient, S67M } from "./earn";

// S67M holder perks. Read-only balance check + optional signed message (no keys stored, no transactions).
const router: IRouter = Router();
const TIERS = [
  { min: 100, id: "wallpaper", title: "Exclusive phone wallpaper (1080×1920)" },
  { min: 500, id: "early", title: "Early-access gallery: newest evolved Mandelbulb before it's public" },
  { min: 1000, id: "vote", title: "Vote on the next print" },
];
const VOTE_OPTIONS = ["Violet coral Mandelbulb", "Teal Seahorse Valley deep zoom", "Gold Burning Ship", "Ice Quaternion Julia"];
const SECRET = process.env.PERK_SECRET || crypto.randomBytes(32).toString("hex");
const ASSETS = path.resolve(process.cwd(), process.env.PERK_ASSETS_DIR || "artifacts/api-server/perk-assets");
const FILES: Record<string, string> = { wallpaper: "wallpaper_gen001_1080x1920.jpg", early: "early_access_gen002.jpg" };
const nonces = new Map<string, { msg: string; exp: number }>();

const sign = (data: string) => crypto.createHmac("sha256", SECRET).update(data).digest("hex");
const token = (addr: string, tier: number, exp: number) => { const d = `${addr}.${tier}.${exp}`; return `${Buffer.from(d).toString("base64url")}.${sign(d)}`; };
function readToken(t: unknown): { addr: string; tier: number } | null {
  if (typeof t !== "string") return null;
  const [b, s] = t.split("."); if (!b || !s) return null;
  const d = Buffer.from(b, "base64url").toString();
  const exp = sign(d);
  if (s.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(exp))) return null;
  const [addr, tier, e] = d.split(".");
  if (Number(e) < Date.now()) return null;
  return { addr, tier: Number(tier) };
}
let ready: Promise<void> | null = null;
const ensureTable = () => (ready ??= pool.query(`CREATE TABLE IF NOT EXISTS perk_votes (address text PRIMARY KEY, choice int NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`).then(() => undefined));

router.get("/perks/info", async (_req, res) => {
  let tally: number[] = VOTE_OPTIONS.map(() => 0);
  try { await ensureTable(); const r = await pool.query(`SELECT choice, count(*)::int n FROM perk_votes GROUP BY choice`); for (const x of r.rows) tally[x.choice] = x.n; } catch { /* db down */ }
  res.json({ token: "S67M", contract: S67M, note: "Sepolia test token, no cash value, not an investment", tiers: TIERS, voteOptions: VOTE_OPTIONS, tally, perkCodeEnabled: !!process.env.PERK_CODE?.trim() });
});

router.get("/perks/challenge", (req, res) => {
  const a = String(req.query.address ?? "").trim();
  if (!isAddress(a, { strict: false })) { res.status(400).json({ error: "Invalid address" }); return; }
  const addr = getAddress(a);
  const msg = `Universe Simon perks: I own ${addr}.\nNonce: ${crypto.randomBytes(8).toString("hex")}\nThis signature costs nothing and sends no transaction.`;
  if (nonces.size > 5000) nonces.clear();
  nonces.set(addr, { msg, exp: Date.now() + 10 * 60_000 });
  res.json({ address: addr, message: msg });
});

router.post("/perks/verify", async (req, res) => {
  const { address, signature } = req.body ?? {};
  if (typeof address !== "string" || !isAddress(address.trim(), { strict: false })) { res.status(400).json({ error: "Invalid address" }); return; }
  const addr = getAddress(address.trim());
  let balance: number;
  try { balance = Number((await publicClient.readContract({ address: S67M, abi: erc20Abi, functionName: "balanceOf", args: [addr] })) / 10n ** 16n) / 100; }
  catch { res.status(502).json({ error: "Could not reach Sepolia" }); return; }
  let verified = false;
  if (typeof signature === "string" && /^0x[0-9a-fA-F]+$/.test(signature.trim())) {
    const n = nonces.get(addr);
    if (!n || n.exp < Date.now()) { res.status(400).json({ error: "Challenge expired, get a new message to sign" }); return; }
    try { verified = await verifyMessage({ address: addr, message: n.msg, signature: signature.trim() as `0x${string}` }); } catch { verified = false; }
    if (!verified) { res.status(400).json({ error: "Signature doesn't match this address" }); return; }
    nonces.delete(addr);
  }
  const unlocked = TIERS.filter(t => balance >= t.min);
  const tier = unlocked.length ? unlocked[unlocked.length - 1].min : 0;
  // Downloads need a proven owner; viewing tiers only needs the public balance.
  const tok = verified && tier ? token(addr, tier, Date.now() + 30 * 60_000) : null;
  res.json({ address: addr, balance, verified, unlocked: unlocked.map(t => t.id), token: tok,
    perkCode: verified && tier >= 100 ? (process.env.PERK_CODE?.trim() || null) : null,
    note: "Sepolia test token, no cash value, not an investment" });
});

router.get("/perks/file/:id", (req, res) => {
  const t = readToken(req.query.t);
  const id = req.params.id;
  const need = TIERS.find(x => x.id === id)?.min;
  if (!t || !FILES[id] || need === undefined || t.tier < need) { res.status(403).json({ error: "Verify your address first" }); return; }
  res.setHeader("Cache-Control", "private, no-store");
  res.sendFile(path.join(ASSETS, FILES[id]));
});

router.post("/perks/vote", async (req, res) => {
  const t = readToken(req.body?.token);
  const choice = Number(req.body?.choice);
  if (!t || t.tier < 1000) { res.status(403).json({ error: "Voting needs a verified 1,000 S67M holder" }); return; }
  if (!Number.isInteger(choice) || choice < 0 || choice >= VOTE_OPTIONS.length) { res.status(400).json({ error: "Invalid choice" }); return; }
  try { await ensureTable(); await pool.query(`INSERT INTO perk_votes(address, choice) VALUES ($1,$2) ON CONFLICT (address) DO UPDATE SET choice=EXCLUDED.choice, created_at=now()`, [t.addr.toLowerCase(), choice]); res.json({ ok: true }); }
  catch (err) { req.log.error({ err }, "vote failed"); res.status(500).json({ error: "Internal server error" }); }
});
export default router;
