import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { PORT } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';

// Import routes
import uploadRoutes from './routes/upload.routes.js';
import analyzeRoutes from './routes/analyze.routes.js';
import projectRoutes from './routes/project.routes.js';
import exportRoutes from './routes/export.routes.js';
// import aiRoutes from './routes/ai.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'AI Code Quality Auditor API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/export', exportRoutes);
// app.use('/api/ai', aiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
