import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cropAdvisoriesRouter from "./cropAdvisories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cropAdvisoriesRouter);

export default router;
