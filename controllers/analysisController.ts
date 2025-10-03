import { Request, Response, NextFunction } from 'express';
import { analyzeGitHubData } from '../services/githubService.js';
import { analyzeRedditData } from '../services/redditService.js';

/**
 * Handles the request to fetch and analyze GitHub data.
 */
export const getGitHubAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('[Controller] Request received for GitHub analysis.');
        const data = await analyzeGitHubData();
        res.status(200).json({ 
            success: true, 
            data: data 
        });
    } catch (error) {
        // Pass the error to the global error handler
        next(error); 
    }
};

/**
 * Handles the request to fetch and analyze Reddit data.
 */
export const getRedditAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('[Controller] Request received for Reddit analysis.');
        const data = await analyzeRedditData();
        res.status(200).json({ 
            success: true, 
            data: data 
        });
    } catch (error) {
        // Pass the error to the global error handler
        next(error); 
    }
};
