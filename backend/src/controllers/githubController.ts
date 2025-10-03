import { Request, Response } from "express";
import { getGithubAnalytics } from "../services/githubService";
import logger from "../logger";

export async function githubAnalyticsHandler(req: Request, res: Response) {
  try {
    const data = await getGithubAnalytics();
    res.json(data);
  } catch (err: any) {
    logger.error("githubAnalyticsHandler error: " + (err.message || String(err)));
    res.status(500).json({ error: "internal" });
  }
}