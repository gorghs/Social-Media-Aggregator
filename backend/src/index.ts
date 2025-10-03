import "dotenv/config";
import app from "./app";
import logger from "./logger";
import { githubQueue, redditQueue } from "./queue";
import cron from "node-cron";
import { fetchAndStoreGithub } from "./jobs/fetchGithubJob";
import { fetchAndStoreReddit } from "./jobs/fetchRedditJob";

// schedule using cron or push to queue
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`API listening on ${PORT}`);
});

// schedule jobs: either add to queue or run directly depending on deployment
const cronExpr = process.env.FETCH_CRON || "*/10 * * * *"; // default every 10 min
cron.schedule(cronExpr, async () => {
  logger.info("Scheduled job enqueued");
  try {
    // push to queue for worker
    await githubQueue.add("github:fetch", {});
    await redditQueue.add("reddit:fetch", {});
  } catch (e) {
    logger.warn("Queue not available, running inline: " + String(e));
    await fetchAndStoreGithub();
    await fetchAndStoreReddit();
  }
});
