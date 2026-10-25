import { Router, type IRouter } from "express";

// Read-only view of Szymon's Simon67 test tokens on Sepolia. No keys, no signing, no wallet connection.
const router: IRouter = Router();
const RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const S67 = "0x66b5BDfe4C0b2BbbF8bC4578d12688d0A12b50c0";
const S67M = process.env.S67M_ADDRESS || "0x01F818701E6C202Ad900a7E63a300662bF17068f";
const SEL = {
  name: "0x06fdde03", symbol: "0x95d89b41", totalSupply: "0x18160ddd", owner: "0x8da5cb5b",
  target: "0xd4b83992", solves: "0x3c8aaa63", reward: "0xcab34c08", maxSupply: "0x32cb6b0c", lastSolveTime: "0x0302a892",
};
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_TOPIC = "0x" + "0".repeat(64);

let id = 1;
async function rpc(method: string, params: unknown[]): Promise<any> {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }), signal: AbortSignal.timeout(10_000) });
  const j: any = await r.json();
  if (j.error) throw new Error(j.error.message || "rpc error");
  return j.result;
}
async function call(to: string, data: string): Promise<string | null> {
  try { const r = await rpc("eth_call", [{ to, data }, "latest"]); return r && r !== "0x" ? r : null; } catch { return null; }
}
const big = (h: string | null) => (h ? BigInt(h.slice(0, 66)) : null);
const fmt18 = (v: bigint | null) => (v === null ? null : Number(v / 10n ** 14n) / 1e4);
function str(h: string | null): string | null {
  if (!h || h.length < 130) return null;
  const len = Number(BigInt("0x" + h.slice(66, 130)));
  return Buffer.from(h.slice(130, 130 + len * 2), "hex").toString("utf8");
}

async function token(address: string) {
  const [code, name, symbol, supply, owner, target, solves, reward, maxSupply, last] = await Promise.all([
    rpc("eth_getCode", [address, "latest"]).catch(() => "0x"),
    call(address, SEL.name), call(address, SEL.symbol), call(address, SEL.totalSupply), call(address, SEL.owner),
    call(address, SEL.target), call(address, SEL.solves), call(address, SEL.reward), call(address, SEL.maxSupply), call(address, SEL.lastSolveTime),
  ]);
  if (!code || code === "0x") return { address, deployed: false };
  const head = Number(BigInt(await rpc("eth_blockNumber", [])));
  let mints: any[] = [];
  for (const span of [50_000, 5_000]) {
    try {
      const logs = await rpc("eth_getLogs", [{ address, fromBlock: "0x" + Math.max(0, head - span).toString(16), toBlock: "latest", topics: [TRANSFER, ZERO_TOPIC] }]);
      mints = logs.slice(-10).reverse().map((l: any) => ({
        to: "0x" + l.topics[2].slice(26), amount: fmt18(BigInt(l.data)), block: Number(BigInt(l.blockNumber)), tx: l.transactionHash,
      }));
      break;
    } catch { /* range too wide, try smaller */ }
  }
  const t = big(target);
  return {
    address, deployed: true, name: str(name), symbol: str(symbol), totalSupply: fmt18(big(supply)),
    owner: owner ? "0x" + owner.slice(26, 66) : null,
    mineable: t !== null,
    // difficulty expressed as expected hashes per solve = 2^256 / target
    difficulty: t ? Number((1n << 256n) / (t === 0n ? 1n : t)) : null,
    solves: solves ? Number(big(solves)) : null, reward: fmt18(big(reward)), maxSupply: fmt18(big(maxSupply)),
    lastSolveTime: last ? Number(big(last)) : null, recentMints: mints,
  };
}

let cache: { at: number; body: any } | null = null;
router.get("/sepolia/tokens", async (req, res) => {
  try {
    if (!cache || Date.now() - cache.at > 30_000) {
      const [s67m, s67] = await Promise.all([token(S67M), token(S67)]);
      cache = { at: Date.now(), body: { network: "Sepolia testnet", note: "Sepolia testnet, no real value", rpc: RPC, tokens: [s67m, s67] } };
    }
    res.json(cache.body);
  } catch (err) {
    req.log.error({ err }, "sepolia read failed");
    res.status(502).json({ error: "Could not reach Sepolia RPC" });
  }
});
export default router;
