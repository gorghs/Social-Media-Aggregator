import axios from "axios";
import { PrismaClient } from "@prisma/client";
import logger from "../logger";
import redis from "../lib/redisClient";
import qs from "qs";

const prisma = new PrismaClient();

const SUBREDDITS = (process.env.REDDIT_SUBREDDITS || "").split(",").map(s => s.trim()).filter(Boolean);
const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const USER_AGENT = process.env.REDDIT_USER_AGENT || "SocialAggregator/0.1";

async function getAppToken() {
  const tokenRes = await axios.post("https://www.reddit.com/api/v1/access_token",
    qs.stringify({ grant_type: "client_credentials" }), {
    auth: { username: CLIENT_ID || "", password: CLIENT_SECRET || "" },
    headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" }
  });
  return tokenRes.data.access_token;
}

export async function fetchAndStoreReddit() {
  logger.info("fetchAndStoreReddit: started");
  try {
    const token = await getAppToken();
    const headers = { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT };

    const postsAccum: any[] = [];

    for (const sub of SUBREDDITS) {
      const res = await axios.get(`https://oauth.reddit.com/r/${sub}/hot?limit=100`, { headers });
      const children = res.data.data.children || [];
      for (const c of children) {
        const d = c.data;
        postsAccum.push({
          id: d.id,
          title: d.title,
          author: d.author,
          subreddit: d.subreddit,
          score: d.score || 0,
          url: `https://reddit.com${d.permalink}`,
          createdAt: new Date(d.created_utc * 1000)
        });
      }
    }

    for (const p of postsAccum) {
      await prisma.redditPost.upsert({
        where: { id: p.id },
        create: { ...p, fetchedAt: new Date() },
        update: { ...p, fetchedAt: new Date() }
      });
    }

    const top5 = postsAccum.sort((a,b) => b.score - a.score).slice(0,5);
    // reddit author with highest total upvotes across their posts
    const authorScores: Record<string, number> = {};
    for (const p of postsAccum) authorScores[p.author] = (authorScores[p.author] || 0) + p.score;
    const topAuthor = Object.entries(authorScores).sort((a,b) => b[1]-a[1])[0] || ["",0];

    const payload = {
      top5ByUpvotes: top5,
      authorWithHighestTotalUpvotes: { author: topAuthor[0], totalUpvotes: topAuthor[1] },
      fetchedAt: new Date().toISOString()
    };

    await redis.set("reddit:analytics", JSON.stringify(payload), "EX", 60*60);
    logger.info("fetchAndStoreReddit: completed and cached");
  } catch (err: any) {
    logger.error("fetchAndStoreReddit error: " + (err.stack || err.message || String(err)));
  }
}