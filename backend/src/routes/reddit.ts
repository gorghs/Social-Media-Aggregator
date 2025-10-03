import { Router } from "express";
import { redditAnalyticsHandler } from "../controllers/redditController";

const router = Router();
router.get("/analytics", redditAnalyticsHandler);

export default router;