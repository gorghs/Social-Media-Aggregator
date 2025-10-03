import redis from "../lib/redisClient";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getGithubAnalytics() {
  const cached = await redis.get("github:analytics");
  if (cached) return JSON.parse(cached);
  // fallback to DB aggregation (simple)
  const issues = await prisma.githubIssue.findMany();
  const top5 = issues.sort((a,b) => b.comments - a.comments).slice(0,5);
  const authorCounts: Record<string, number> = {};
  for (const i of issues) authorCounts[i.author] = (authorCounts[i.author] || 0) + 1;
  const topAuthor = Object.entries(authorCounts).sort((a,b) => b[1]-a[1])[0] || ["",0];
  const repoCounts: Record<string, number> = {};
  for (const i of issues) repoCounts[i.repo] = (repoCounts[i.repo] || 0) + 1;
  const topRepo = Object.entries(repoCounts).sort((a,b) => b[1]-a[1])[0] || ["",0];
  return { top5IssuesByComments: top5, authorWithMostIssues: { author: topAuthor[0], count: topAuthor[1] }, repoWithMostOpenIssues: { repo: topRepo[0], count: topRepo[1] }, fetchedAt: new Date().toISOString() };
}
