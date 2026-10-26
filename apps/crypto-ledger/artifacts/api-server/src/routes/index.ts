import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import portfolioRouter from "./portfolio";
import tokenTransfersRouter from "./token-transfers";
import miningRouter from "./mining";
import configRouter from "./config";
import sepoliaRouter from "./sepolia";
import earnRouter from "./earn";
import perksRouter from "./perks";
import xmrRouter from "./xmr";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(portfolioRouter);
router.use(tokenTransfersRouter);
router.use(miningRouter);
router.use(configRouter);
router.use(sepoliaRouter);
router.use(earnRouter);
router.use(perksRouter);
router.use(xmrRouter);

export default router;
