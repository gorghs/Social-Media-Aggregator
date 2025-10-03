import redis from "../lib/redisClient";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getRedditAnalytics() {
  const cached = await redis.get("reddit:analytics");
  if (cached) return JSON.parse(cached);
  const posts = await prisma.redditPost.findMany();
  const top5 = posts.sort((a,b) => b.score - a.score).slice(0,5);
  const authorScores: Record<string, number> = {};
  for (const p of posts) authorScores[p.author] = (authorScores[p.author] || 0) + p.score;
  const topAuthor = Object.entries(authorScores).sort((a,b) => b[1]-a[1])[0] || ["",0];
  return { top5ByUpvotes: top5, authorWithHighestTotalUpvotes: { author: topAuthor[0], totalUpvotes: topAuthor[1] }, fetchedAt: new Date().toISOString() };
}
