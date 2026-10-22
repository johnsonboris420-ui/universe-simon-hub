import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { minedBlocksTable, miningWalletTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DEST_WALLET_1 = "none (simulation)";
const DEST_WALLET_2 = "none (simulation)";

function generateHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function computePower(blocksMined: number): number {
  if (blocksMined === 0) return 8;
  return Math.min(8 + Math.log(blocksMined + 1) * 2.5, 20);
}

function computeMaxIter(blocksMined: number): number {
  if (blocksMined === 0) return 50;
  return Math.min(Math.floor(50 + Math.log(blocksMined + 1) * 15), 150);
}

async function ensureWallet() {
  const wallets = await db.select().from(miningWalletTable).limit(1);
  if (wallets.length === 0) {
    const [wallet] = await db
      .insert(miningWalletTable)
      .values({
        totalBtc: "0",
        totalEth: "0",
        totalGas: "0",
        blocksMined: 0,
        destinationWallet1: DEST_WALLET_1,
        destinationWallet2: DEST_WALLET_2,
      })
      .returning();
    return wallet;
  }
  const w = wallets[0];
  if (!w.destinationWallet1 || !w.destinationWallet2) {
    const [updated] = await db
      .update(miningWalletTable)
      .set({ destinationWallet1: DEST_WALLET_1, destinationWallet2: DEST_WALLET_2 })
      .where(eq(miningWalletTable.id, w.id))
      .returning();
    return updated;
  }
  return w;
}

async function mineBlock() {
  const wallet = await ensureWallet();

  const blocksMined = wallet.blocksMined;
  const blockNum = blocksMined + 1;

  const btcReward = (Math.random() * 0.0005 + 0.0001).toFixed(8);
  const ethReward = (Math.random() * 0.003 + 0.001).toFixed(8);
  const gasFee = (Math.random() * 0.0005 + 0.0001).toFixed(8);

  const power = computePower(blocksMined);
  const wSlice = (Math.sin(blockNum * 0.37) * 0.8).toFixed(6);
  const hash = generateHash();

  const newTotalBtc = (parseFloat(wallet.totalBtc) + parseFloat(btcReward)).toFixed(8);
  const netEth = parseFloat(ethReward) - parseFloat(gasFee);
  const newTotalEth = (parseFloat(wallet.totalEth ?? "0") + netEth).toFixed(8);
  const newTotalGas = (parseFloat(wallet.totalGas) + parseFloat(gasFee)).toFixed(8);

  const { block, updatedWallet } = await db.transaction(async (tx) => {
    const [block] = await tx
      .insert(minedBlocksTable)
      .values({
        blockNum,
        hash,
        btcReward,
        ethReward,
        gasFee,
        powerSnapshot: power,
        wSliceSnapshot: parseFloat(wSlice),
      })
      .returning();

    const [updatedWallet] = await tx
      .update(miningWalletTable)
      .set({
        totalBtc: newTotalBtc,
        totalEth: newTotalEth,
        totalGas: newTotalGas,
        blocksMined: blockNum,
        lastMinedAt: new Date(),
      })
      .where(eq(miningWalletTable.id, wallet.id))
      .returning();

    return { block, updatedWallet };
  });

  return {
    block: {
      id: block.id,
      blockNum: block.blockNum,
      hash: block.hash,
      btcReward: parseFloat(block.btcReward),
      ethReward: parseFloat(block.ethReward),
      gasFee: parseFloat(block.gasFee),
      powerSnapshot: block.powerSnapshot,
      wSliceSnapshot: block.wSliceSnapshot,
      minedAt: block.minedAt,
    },
    wallet: {
      totalBtc: parseFloat(updatedWallet.totalBtc),
      totalEth: parseFloat(updatedWallet.totalEth ?? "0"),
      totalGas: parseFloat(updatedWallet.totalGas),
      blocksMined: updatedWallet.blocksMined,
      lastMinedAt: updatedWallet.lastMinedAt,
      destinationWallet1: updatedWallet.destinationWallet1 ?? DEST_WALLET_1,
      destinationWallet2: updatedWallet.destinationWallet2 ?? DEST_WALLET_2,
    },
    fractal: {
      power: computePower(updatedWallet.blocksMined),
      maxIter: computeMaxIter(updatedWallet.blocksMined),
      wSlice: parseFloat(wSlice),
    },
  };
}

export function startBackgroundMiner(intervalMs = 30_000) {
  logger.info({ intervalMs }, "Background miner started");
  const tick = async () => {
    try {
      const result = await mineBlock();
      logger.info(
        { blockNum: result.block.blockNum, btcReward: result.block.btcReward },
        "Background block mined"
      );
    } catch (err) {
      logger.error({ err }, "Background miner error");
    }
  };
  tick();
  setInterval(tick, intervalMs);
}

router.post("/mining/mine", async (req, res) => {
  if (process.env.ALLOW_MANUAL_MINE !== "true") { res.status(403).json({ error: "Manual mining disabled on this server (simulation runs automatically)" }); return; }
  try {
    const result = await mineBlock();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to mine block");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mining/wallet", async (req, res) => {
  try {
    const wallet = await ensureWallet();
    res.json({
      totalBtc: parseFloat(wallet.totalBtc),
      totalEth: parseFloat(wallet.totalEth ?? "0"),
      totalGas: parseFloat(wallet.totalGas),
      blocksMined: wallet.blocksMined,
      lastMinedAt: wallet.lastMinedAt,
      destinationWallet1: wallet.destinationWallet1 ?? DEST_WALLET_1,
      destinationWallet2: wallet.destinationWallet2 ?? DEST_WALLET_2,
      fractal: {
        power: computePower(wallet.blocksMined),
        maxIter: computeMaxIter(wallet.blocksMined),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get mining wallet");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mining/blocks", async (req, res) => {
  try {
    const blocks = await db
      .select()
      .from(minedBlocksTable)
      .orderBy(desc(minedBlocksTable.minedAt))
      .limit(50);

    res.json(
      blocks.map((b) => ({
        id: b.id,
        blockNum: b.blockNum,
        hash: b.hash,
        btcReward: parseFloat(b.btcReward),
        ethReward: parseFloat(b.ethReward ?? "0"),
        gasFee: parseFloat(b.gasFee),
        powerSnapshot: b.powerSnapshot,
        wSliceSnapshot: b.wSliceSnapshot,
        minedAt: b.minedAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get mined blocks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mining/holding", async (req, res) => {
  try {
    const wallet = await ensureWallet();
    const totalBtc = parseFloat(wallet.totalBtc);
    const totalEth = parseFloat(wallet.totalEth ?? "0");
    const btcPriceUsd = 65000;
    const ethPriceUsd = 3500;
    res.json([
      {
        symbol: "BTC",
        name: "Simulated BTC (not real crypto)",
        amount: totalBtc,
        valueUsd: totalBtc * btcPriceUsd,
        priceUsd: btcPriceUsd,
        change24hPercent: 0,
        chain: "Simulation",
      },
      {
        symbol: "ETH",
        name: "Simulated ETH (not real crypto)",
        amount: totalEth,
        valueUsd: totalEth * ethPriceUsd,
        priceUsd: ethPriceUsd,
        change24hPercent: 0,
        chain: "Simulation",
      },
    ]);
  } catch (err) {
    req.log.error({ err }, "Failed to get mining holding");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mining/transactions", async (req, res) => {
  try {
    const blocks = await db
      .select()
      .from(minedBlocksTable)
      .orderBy(desc(minedBlocksTable.minedAt))
      .limit(20);

    res.json(
      blocks.map((b) => ({
        id: b.id + 100000,
        hash: b.hash,
        chainName: "Simulation",
        status: "Success",
        action: "Mine",
        token: "BTC",
        from: "Simulation",
        fromInfo: "Simulation, not real crypto",
        to: "Simulation only (nothing sent)",
        toInfo: "Simulation, not real crypto",
        amount: `+${parseFloat(b.btcReward).toFixed(8)} BTC`,
        ethReward: `+${parseFloat(b.ethReward ?? "0").toFixed(8)} ETH`,
        fee: `${parseFloat(b.gasFee).toFixed(8)} ETH`,
        block: String(b.blockNum),
        createdAt: b.minedAt instanceof Date ? b.minedAt.toISOString() : String(b.minedAt),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get mining transactions");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
