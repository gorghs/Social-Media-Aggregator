import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

export const githubQueue = new Queue("github-fetch", { connection });
export const redditQueue = new Queue("reddit-fetch", { connection });
