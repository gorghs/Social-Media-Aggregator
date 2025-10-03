import { Router } from "express";
import { githubAnalyticsHandler } from "../controllers/githubController";

const router = Router();
router.get("/analytics", githubAnalyticsHandler);

export default router;
