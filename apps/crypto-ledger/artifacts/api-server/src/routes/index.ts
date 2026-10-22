import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import portfolioRouter from "./portfolio";
import tokenTransfersRouter from "./token-transfers";
import miningRouter from "./mining";
import configRouter from "./config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(portfolioRouter);
router.use(tokenTransfersRouter);
router.use(miningRouter);
router.use(configRouter);

export default router;
