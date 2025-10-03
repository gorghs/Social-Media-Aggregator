import { Router } from 'express';
import { getGitHubAnalysis, getRedditAnalysis } from '../controllers/analysisController.js';

const router = Router();

// Route: GET /api/v1/analysis/github
router.get('/analysis/github', getGitHubAnalysis);

// Route: GET /api/v1/analysis/reddit
router.get('/analysis/reddit', getRedditAnalysis);

export const analysisRouter = router;
