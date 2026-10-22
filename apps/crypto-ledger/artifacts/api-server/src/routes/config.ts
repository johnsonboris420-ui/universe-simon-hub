import { Router, type IRouter } from "express";
import { DEFAULT_WALLET } from "../lib/live";

const router: IRouter = Router();
// Public, read-only app config for the dashboard.
router.get("/config", (_req, res) => {
  res.json({
    defaultWallet: DEFAULT_WALLET,
    csvImport: process.env.ALLOW_CSV_IMPORT !== "false",
    learnchainUrl: process.env.LEARNCHAIN_URL ?? "/learnchain/",
    readOnly: true,
  });
});
export default router;
