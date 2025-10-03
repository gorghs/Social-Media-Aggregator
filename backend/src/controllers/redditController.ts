import { Request, Response } from "express";
import { getRedditAnalytics } from "../services/redditService";
import logger from "../logger";

export async function redditAnalyticsHandler(req: any, res: any) {
  try {
    const data = await getRedditAnalytics();
    res.json(data);
  } catch (err: any) {
    logger.error("redditAnalyticsHandler error: " + (err.message || String(err)));
    res.status(500).json({ error: "internal" });
  }
}
