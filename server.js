import express from 'express';
import dotenv from 'dotenv';
import { analysisRouter } from './routes/analysisRoutes.js';

// 1. Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware setup
app.use(express.json());

// 3. API Routes
app.use('/api/v1', analysisRouter);

// Basic health check route
app.get('/', (req, res) => {
    res.status(200).send({
        message: 'Data Analyzer API is running successfully!',
        endpoints: ['/api/v1/analysis/github', '/api/v1/analysis/reddit']
    });
});

// 4. Global Error Handler - Essential for production code
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: 'An unexpected server error occurred.',
        details: err.message
    });
});

// 5. Start the server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`➡️  Open http://localhost:${PORT}`);
});
