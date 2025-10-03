import axios from "axios";
import { PrismaClient } from "@prisma/client";
import logger from "../logger";
import redis from "../lib/redisClient";
import { allowRequest } from "../lib/rateLimiter";

const prismaClient = new PrismaClient();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPOS_ORGS = (process.env.GITHUB_ORGS_OR_REPOS || "").split(",").map(s => s.trim()).filter(Boolean);

async function fetchRepoIssues(owner: string, repo: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?per_page=100&state=open`;
  const headers: any = { Accept: "application/vnd.github.v3+json" };
  if (GITHUB_TOKEN) headers.Authorization = `token ${GITHUB_TOKEN}`;
  if (!await allowRequest("github", 400, 60)) {
    logger.warn("GitHub rate-limited by local limiter");
    return [];
  }
  const res = await axios.get(url, { headers });
  return res.data;
}

export async function fetchAndStoreGithub() {
  logger.info("fetchAndStoreGithub: started");
  try {
    const issuesAccum: any[] = [];
    for (const item of REPOS_ORGS) {
      if (!item) continue;
      if (item.startsWith("org:")) {
        const org = item.replace("org:", "");
        // fetch repos for org
        const reposRes = await axios.get(`https://api.github.com/orgs/${org}/repos?per_page=100`, { headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : undefined });
        const repos = reposRes.data || [];
        for (const r of repos) {
          const repoIssues = await fetchRepoIssues(r.owner.login, r.name);
          for (const is of repoIssues) {
            if (is.pull_request) continue;
            issuesAccum.push({
              id: `${is.id}`,
              title: is.title,
              body: is.body,
              comments: is.comments || 0,
              author: is.user?.login || "",
              repo: `${r.full_name}`,
              url: is.html_url,
              createdAt: new Date(is.created_at)
            });
          }
        }
      } else if (item.includes("/")) {
        const [owner, repo] = item.split("/");
        const repoIssues = await fetchRepoIssues(owner, repo);
        for (const is of repoIssues) {
          if (is.pull_request) continue;
          issuesAccum.push({
            id: `${is.id}`,
            title: is.title,
            body: is.body,
            comments: is.comments || 0,
            author: is.user?.login || "",
            repo: item,
            url: is.html_url,
            createdAt: new Date(is.created_at)
          });
        }
      }
    }

    // Upsert into DB
    for (const it of issuesAccum) {
      await prismaClient.githubIssue.upsert({
        where: { id: it.id },
        create: { ...it, fetchedAt: new Date() },
        update: { ...it, fetchedAt: new Date() }
      });
    }

    // Build analytics and cache results
    const topByComments = issuesAccum.sort((a,b) => b.comments - a.comments).slice(0,5);
    // author with most issues
    const authorCounts: Record<string, number> = {};
    for (const i of issuesAccum) authorCounts[i.author] = (authorCounts[i.author] || 0) + 1;
    const topAuthor = Object.entries(authorCounts).sort((a,b) => b[1]-a[1])[0] || ["",0];
    // repo with most open issues
    const repoCounts: Record<string, number> = {};
    for (const i of issuesAccum) repoCounts[i.repo] = (repoCounts[i.repo] || 0) + 1;
    const topRepo = Object.entries(repoCounts).sort((a,b) => b[1]-a[1])[0] || ["",0];

    const payload = {
      top5IssuesByComments: topByComments,
      authorWithMostIssues: { author: topAuthor[0], count: topAuthor[1] },
      repoWithMostOpenIssues: { repo: topRepo[0], count: topRepo[1] },
      fetchedAt: new Date().toISOString()
    };

    await redis.set("github:analytics", JSON.stringify(payload), "EX", 60 * 60); // 1 hour
    logger.info("fetchAndStoreGithub: completed and cached");
  } catch (err: any) {
    logger.error("fetchAndStoreGithub error: " + (err.stack || err.message || String(err)));
  }
}
