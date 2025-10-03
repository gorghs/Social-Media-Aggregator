import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import logger from "../logger";
import { fetchAndStoreGithub } from "../jobs/fetchGithubJob";
import { fetchAndStoreReddit } from "../jobs/fetchRedditJob";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

new Worker("github-fetch", async (job: Job) => {
  logger.info("Worker: github job started");
  await fetchAndStoreGithub();
}, { connection });

new Worker("reddit-fetch", async (job: Job) => {
  logger.info("Worker: reddit job started");
  await fetchAndStoreReddit();
}, { connection });

logger.info("Worker started");
