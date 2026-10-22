// The original Replit seed contained one person's real wallet history. It has been removed for the
// public repo: live data now comes from public chain APIs for the wallet in WALLET_ADDRESS / ?address=.
// This script just clears legacy sample tables.
import { db, transactionsTable, tokenTransfersTable, holdingsTable } from "@workspace/db";

async function main() {
  await db.delete(transactionsTable);
  await db.delete(holdingsTable);
  await db.delete(tokenTransfersTable);
  console.log("Cleared sample tables (no personal data is seeded).");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
