import { pgTable, text, serial, integer, decimal, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull(),
  chainName: text("chain_name").notNull(),
  status: text("status").notNull(),
  action: text("action").notNull(),
  token: text("token").notNull(),
  from: text("from").notNull(),
  fromInfo: text("from_info").notNull(),
  to: text("to").notNull(),
  toInfo: text("to_info").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tokenTransfersTable = pgTable("token_transfers", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull(),
  status: text("status").notNull(),
  method: text("method").notNull(),
  blockNo: integer("block_no").notNull(),
  dateTime: text("date_time").notNull(),
  from: text("from").notNull(),
  fromNametag: text("from_nametag").notNull().default(""),
  to: text("to").notNull(),
  toNametag: text("to_nametag").notNull().default(""),
  amount: text("amount").notNull(),
  valueUsd: text("value_usd").notNull(),
  token: text("token").notNull(),
});

export const holdingsTable = pgTable("holdings", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 30, scale: 10 }).notNull(),
  valueUsd: decimal("value_usd", { precision: 18, scale: 4 }).notNull(),
  priceUsd: decimal("price_usd", { precision: 18, scale: 8 }).notNull(),
  change24hPercent: decimal("change_24h_percent", { precision: 10, scale: 4 }).notNull(),
  chain: text("chain").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

export const insertTokenTransferSchema = createInsertSchema(tokenTransfersTable).omit({ id: true });
export type InsertTokenTransfer = z.infer<typeof insertTokenTransferSchema>;
export type TokenTransfer = typeof tokenTransfersTable.$inferSelect;

export const insertHoldingSchema = createInsertSchema(holdingsTable).omit({ id: true });
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdingsTable.$inferSelect;

export const minedBlocksTable = pgTable("mined_blocks", {
  id: serial("id").primaryKey(),
  blockNum: integer("block_num").notNull(),
  hash: text("hash").notNull(),
  btcReward: decimal("btc_reward", { precision: 18, scale: 8 }).notNull(),
  ethReward: decimal("eth_reward", { precision: 18, scale: 8 }).notNull().default("0"),
  gasFee: decimal("gas_fee", { precision: 18, scale: 8 }).notNull(),
  powerSnapshot: real("power_snapshot").notNull(),
  wSliceSnapshot: real("w_slice_snapshot").notNull(),
  minedAt: timestamp("mined_at").defaultNow().notNull(),
});

export const miningWalletTable = pgTable("mining_wallet", {
  id: serial("id").primaryKey(),
  totalBtc: decimal("total_btc", { precision: 18, scale: 8 }).notNull().default("0"),
  totalEth: decimal("total_eth", { precision: 18, scale: 8 }).notNull().default("0"),
  totalGas: decimal("total_gas", { precision: 18, scale: 8 }).notNull().default("0"),
  blocksMined: integer("blocks_mined").notNull().default(0),
  lastMinedAt: timestamp("last_mined_at"),
  destinationWallet1: text("destination_wallet_1").default("none (simulation)"),
  destinationWallet2: text("destination_wallet_2").default("none (simulation)"),
});

export const insertMinedBlockSchema = createInsertSchema(minedBlocksTable).omit({ id: true });
export type InsertMinedBlock = z.infer<typeof insertMinedBlockSchema>;
export type MinedBlock = typeof minedBlocksTable.$inferSelect;

export const insertMiningWalletSchema = createInsertSchema(miningWalletTable).omit({ id: true });
export type InsertMiningWallet = z.infer<typeof insertMiningWalletSchema>;
export type MiningWallet = typeof miningWalletTable.$inferSelect;
