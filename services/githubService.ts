import axios, { AxiosInstance } from 'axios';
import 'dotenv/config'; // Ensures process.env is available

// Define the shape of GitHub Issue data we care about
interface GitHubIssue {
    title: string;
    comments: number;
    html_url: string;
    user: { login: string };
    state: 'open' | 'closed';
    pull_request?: Record<string, unknown>; // Exists if it's a PR
}

// Configuration from environment variables
const GITHUB_REPO_TARGET = process.env.GITHUB_REPO_TARGET || 'facebook/react';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_BASE_URL = 'https://api.github.com';
const MAX_PAGES = 5; // Limit to 500 issues max to avoid rate limiting for now

const GITHUB_API: AxiosInstance = axios.create({
    baseURL: GITHUB_BASE_URL,
    headers: {
        'Authorization': GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : undefined,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Node-Data-Analyzer-App',
        'X-GitHub-Api-Version': '2022-11-28'
    }
});

/**
 * Fetches all issues (up to MAX_PAGES) for the target repository.
 */
async function fetchAllIssues(): Promise<GitHubIssue[]> {
    let allIssues: GitHubIssue[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES) {
        try {
            const response = await GITHUB_API.get(`/repos/${GITHUB_REPO_TARGET}/issues`, {
                params: {
                    state: 'all', // Get both open and closed issues
                    per_page: 100,
                    page: page
                }
            });

            const issues = response.data as GitHubIssue[];
            if (issues.length === 0) {
                hasMore = false;
            } else {
                allIssues = allIssues.concat(issues);
                page++;
            }
        } catch (error) {
            console.error(`Error fetching GitHub issues page ${page}:`, (error as Error).message);
            throw new Error(`Failed to fetch issues from GitHub. Check your GITHUB_TOKEN and GITHUB_REPO_TARGET.`);
        }
    }
    return allIssues;
}

/**
 * Executes all required GitHub analysis tasks.
 */
export async function analyzeGitHubData() {
    console.log(`[Service] Starting GitHub analysis for: ${GITHUB_REPO_TARGET}`);

    const [allIssues, repoDetails] = await Promise.all([
        fetchAllIssues(),
        GITHUB_API.get(`/repos/${GITHUB_REPO_TARGET}`)
    ]);

    const issuesOnly = allIssues.filter(issue => !issue.pull_request);

    // 1. Top 5 GitHub issues by comment count
    const topIssuesByComments = issuesOnly
        .sort((a, b) => b.comments - a.comments)
        .slice(0, 5)
        .map(issue => ({
            title: issue.title,
            comments: issue.comments,
            url: issue.html_url
        }));

    // 2. Author with the most GitHub issues (in the target repo)
    const authorIssueCounts = issuesOnly.reduce((acc, issue) => {
        const author = issue.user?.login;
        if (author) {
            acc[author] = (acc[author] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const topAuthor = Object.entries(authorIssueCounts).reduce((top, [author, count]) => {
        // FIX: The type of 'count' from Object.entries can be inferred as 'unknown'.
        // Added a type guard to ensure it's a number before comparison.
        return (typeof count === 'number' && count > top.count) ? { author, count } : top;
    }, { author: 'N/A', count: 0 });

    // 3. Repo with the most open issues (We analyze the target repo)
    const openIssuesCount = issuesOnly.filter(issue => issue.state === 'open').length;

    return {
        targetRepo: GITHUB_REPO_TARGET,
        totalIssuesAnalyzed: issuesOnly.length,
        repoDescription: repoDetails.data.description,
        results: {
            topIssuesByComments,
            authorWithMostIssues: topAuthor,
            repoOpenIssueCount: {
                repo: GITHUB_REPO_TARGET,
                open_issues: openIssuesCount
            }
        }
    };
}