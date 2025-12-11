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
import chatRoutes from './routes/chat.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import authRoutes from './routes/auth.routes.js';
// import aiRoutes from './routes/ai.routes.js';

// Load environment variables
dotenv.config();

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Initialize Express app
const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*', // Allow all in dev, restrict in prod
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

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
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/webhooks', webhookRoutes);
// app.use('/api/ai', aiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`📍 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
