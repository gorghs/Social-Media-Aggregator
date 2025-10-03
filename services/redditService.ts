import axios, { AxiosInstance } from 'axios';
import 'dotenv/config'; // Ensures process.env is available

// Define the shape of Reddit Post data we care about
interface RedditPost {
    title: string;
    score: number; // upvotes
    permalink: string;
    author: string;
}

// Configuration
const REDDIT_SUBREDDIT_TARGET = 'programming'; // Using a fixed subreddit for now
const REDDIT_BASE_URL = 'https://www.reddit.com/r';

const REDDIT_API: AxiosInstance = axios.create({
    baseURL: REDDIT_BASE_URL,
    headers: {
        // Reddit requires a User-Agent header
        'User-Agent': 'Node-Data-Analyzer-App/v1.0 by GeminiBot' 
    }
});

/**
 * Executes all required Reddit analysis tasks.
 */
export async function analyzeRedditData() {
    console.log(`[Service] Starting Reddit analysis for subreddit: r/${REDDIT_SUBREDDIT_TARGET}`);
    
    let posts: RedditPost[] = [];
    try {
        // Fetch the top 100 posts from the target subreddit over the last year
        const response = await REDDIT_API.get(`/${REDDIT_SUBREDDIT_TARGET}/top.json`, {
            params: {
                limit: 100,
                t: 'year' // Timeframe: past year
            }
        });

        // The posts are nested under response.data.data.children
        posts = response.data.data.children
            .map((child: { data: RedditPost }) => child.data)
            .filter((post: RedditPost) => post.author && post.author !== '[deleted]');
    } catch (error) {
        console.error(`Error fetching Reddit data:`, (error as Error).message);
        throw new Error('Failed to fetch posts from Reddit. Check the subreddit name.');
    }

    // --- Analysis Functions ---

    // 1. Top 5 Reddit posts by upvotes
    const topPostsByUpvotes = posts
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(post => ({
            title: post.title,
            upvotes: post.score,
            url: `https://reddit.com${post.permalink}`
        }));

    // 2. Reddit author with the highest total upvotes across their posts
    const authorUpvoteCounts = posts.reduce((acc, post) => {
        acc[post.author] = (acc[post.author] || 0) + post.score;
        return acc;
    }, {} as Record<string, number>);

    const topAuthor = Object.entries(authorUpvoteCounts).reduce((top, [author, totalUpvotes]) => {
        // FIX: The type of 'totalUpvotes' from Object.entries can be inferred as 'unknown'.
        // Added a type guard to ensure it's a number before comparison.
        return (typeof totalUpvotes === 'number' && totalUpvotes > top.totalUpvotes) ? { author, totalUpvotes } : top;
    }, { author: 'N/A', totalUpvotes: 0 });

    return {
        targetSubreddit: REDDIT_SUBREDDIT_TARGET,
        totalPostsAnalyzed: posts.length,
        results: {
            topPostsByUpvotes,
            authorWithHighestTotalUpvotes: topAuthor
        }
    };
}