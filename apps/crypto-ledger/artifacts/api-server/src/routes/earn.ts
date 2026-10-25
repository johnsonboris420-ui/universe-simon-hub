import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { pool } from "@workspace/db";
import { createWalletClient, createPublicClient, http, isAddress, getAddress, parseUnits, erc20Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

// Learn-to-earn: pass a LearnChain quiz, get Sepolia TEST S67M (no cash value).
// Faucet key comes only from the FAUCET_PRIVATE_KEY env var. Users never give keys or connect wallets.
const router: IRouter = Router();
export const RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
export const S67M = getAddress(process.env.S67M_ADDRESS || "0x01F818701E6C202Ad900a7E63a300662bF17068f");
const REWARD = process.env.EARN_REWARD || "10";
const DAILY_CAP = Number(process.env.EARN_DAILY_CAP || 100);
const IP_DAILY = Number(process.env.EARN_IP_DAILY || 5);
export const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC) });

type Q = { q: string; options: string[]; answer: number };
export const LESSONS: { id: string; title: string; summary: string; learnUrl: string; questions: Q[] }[] = [
  { id: "hashing", title: "Lesson 1: Hashing and the chain", learnUrl: "/learnchain/",
    summary: "A SHA-256 hash is a 64-character fingerprint of data. Each block stores the hash of the block before it, so changing an old block breaks every link after it.",
    questions: [
      { q: "How long is a SHA-256 hash written in hex?", options: ["32 characters", "64 characters", "128 characters"], answer: 1 },
      { q: "What happens to a hash if you change one letter of the input?", options: ["It changes completely", "Only the last character changes", "It stays the same"], answer: 0 },
      { q: "What does each block store to link it to its parent?", options: ["The miner's password", "The previous block's hash", "The current price of ETH"], answer: 1 },
      { q: "What is the first block in a chain called?", options: ["The genesis block", "The coinbase block", "The root key"], answer: 0 },
    ] },
  { id: "pow", title: "Lesson 2: Proof of work and mining", learnUrl: "/learnchain/",
    summary: "Miners try nonce after nonce until the block hash is below a target. Each extra leading zero is about 16 times more work, which makes rewriting history expensive. S67M uses the same idea on Sepolia.",
    questions: [
      { q: "What number does a miner change to search for a valid hash?", options: ["The nonce", "The block height", "The timestamp only"], answer: 0 },
      { q: "Roughly how much more work is one extra leading hex zero?", options: ["2x", "16x", "1000x"], answer: 1 },
      { q: "How does S67M reward a valid proof-of-work solve?", options: ["50 test S67M, no cash value", "Real ETH", "A Redbubble voucher"], answer: 0 },
      { q: "Why does proof of work protect history?", options: ["A cheater must redo the work for that block and every block after it", "Blocks are stored on one secret server", "Hashes can be reversed"], answer: 0 },
    ] },
  { id: "keys", title: "Lesson 3: Keys and signatures", learnUrl: "/learnchain/",
    summary: "A wallet is a key pair. The private key signs and must never be shared; the public address lets anyone check signatures. No real site needs your private key.",
    questions: [
      { q: "Which key must you never share?", options: ["Public address", "Private key", "Both are fine to share"], answer: 1 },
      { q: "What can anyone do with your public address?", options: ["Spend your coins", "Check your signatures and send you tokens", "Reset your password"], answer: 1 },
      { q: "A website asks for your seed phrase to give you free tokens. You should:", options: ["Paste it in", "Refuse: it's a scam", "Email it instead"], answer: 1 },
    ] },
];

let ready: Promise<void> | null = null;
function ensureTable() {
  ready ??= pool.query(`CREATE TABLE IF NOT EXISTS earn_claims (
    id serial PRIMARY KEY, address text NOT NULL, lesson text NOT NULL, ip_hash text NOT NULL,
    tx_hash text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (address, lesson))`).then(() => undefined);
  return ready;
}
function faucet() {
  const k = process.env.FAUCET_PRIVATE_KEY?.trim();
  if (!k || !/^0x[0-9a-fA-F]{64}$/.test(k)) return null;
  const account = privateKeyToAccount(k as `0x${string}`);
  return { account, wallet: createWalletClient({ account, chain: sepolia, transport: http(RPC) }) };
}
const ipHash = (ip: string) => crypto.createHash("sha256").update((process.env.IP_SALT || "us-hub") + ip).digest("hex").slice(0, 32);

router.get("/earn/lessons", async (_req, res) => {
  const f = faucet();
  let remaining: number | null = null;
  if (f) { try { remaining = Number((await publicClient.readContract({ address: S67M, abi: erc20Abi, functionName: "balanceOf", args: [f.account.address] })) / 10n ** 18n); } catch { /* rpc down */ } }
  res.json({ enabled: !!f, reward: Number(REWARD), token: "S67M", note: "Sepolia test tokens, no cash value",
    faucetAddress: f?.account.address ?? null, faucetRemaining: remaining, contract: S67M,
    lessons: LESSONS.map(l => ({ id: l.id, title: l.title, summary: l.summary, learnUrl: l.learnUrl, questions: l.questions.map(q => ({ q: q.q, options: q.options })) })) });
});

let sending = Promise.resolve();
router.post("/earn/claim", async (req, res) => {
  const { lessonId, answers, address } = req.body ?? {};
  const lesson = LESSONS.find(l => l.id === lessonId);
  if (!lesson) { res.status(400).json({ error: "Unknown lesson" }); return; }
  if (!Array.isArray(answers) || answers.length !== lesson.questions.length) { res.status(400).json({ error: "Answer every question" }); return; }
  const wrong = lesson.questions.map((q, i) => (Number(answers[i]) === q.answer ? -1 : i)).filter(i => i >= 0);
  if (wrong.length) { res.status(200).json({ ok: false, passed: false, wrong, error: `Not quite: ${wrong.length} wrong. Re-read the lesson and try again.` }); return; }
  if (typeof address !== "string" || !isAddress(address.trim(), { strict: false })) { res.status(400).json({ ok: false, passed: true, error: "That isn't a valid 0x address" }); return; }
  const addr = getAddress(address.trim());
  if (BigInt(addr) < 1000n) { res.status(400).json({ ok: false, passed: true, error: "Use your own address" }); return; }
  const f = faucet();
  if (!f) { res.status(503).json({ ok: false, passed: true, error: "Quiz passed! The test-token faucet isn't switched on yet, check back soon." }); return; }
  if (addr === f.account.address || addr === S67M) { res.status(400).json({ ok: false, passed: true, error: "Use your own address" }); return; }
  try {
    await ensureTable();
    const ih = ipHash(req.ip || "?");
    const day = await pool.query(`SELECT count(*)::int AS n, count(*) FILTER (WHERE ip_hash=$1)::int AS ip FROM earn_claims WHERE created_at > now() - interval '1 day'`, [ih]);
    if (day.rows[0].n >= DAILY_CAP) { res.status(429).json({ ok: false, passed: true, error: "Today's faucet limit is reached. Try again tomorrow." }); return; }
    if (day.rows[0].ip >= IP_DAILY) { res.status(429).json({ ok: false, passed: true, error: "Daily limit for your connection reached. Try again tomorrow." }); return; }
    const ins = await pool.query(`INSERT INTO earn_claims(address, lesson, ip_hash) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`, [addr.toLowerCase(), lesson.id, ih]);
    if (!ins.rowCount) { res.status(409).json({ ok: false, passed: true, error: "This address already claimed for this lesson." }); return; }
    const id = ins.rows[0].id;
    let hash: string;
    try {
      const p = sending.then(() => f.wallet.writeContract({ address: S67M, abi: erc20Abi, functionName: "transfer", args: [addr, parseUnits(REWARD, 18)] }));
      sending = p.then(() => undefined, () => undefined);
      hash = await p;
    } catch (err) {
      await pool.query(`DELETE FROM earn_claims WHERE id=$1`, [id]);
      req.log.error({ err: String(err).slice(0, 300) }, "faucet send failed");
      res.status(502).json({ ok: false, passed: true, error: "Sending failed, please try again later." }); return;
    }
    await pool.query(`UPDATE earn_claims SET tx_hash=$1 WHERE id=$2`, [hash, id]);
    res.json({ ok: true, passed: true, amount: Number(REWARD), token: "S67M", tx: hash, explorer: `https://sepolia.etherscan.io/tx/${hash}`, note: "Sepolia test tokens, no cash value" });
  } catch (err) {
    req.log.error({ err }, "claim failed");
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
export default router;
