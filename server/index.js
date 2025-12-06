import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'AI Code Quality Auditor API is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
import uploadRoutes from './routes/upload.js';
import projectRoutes from './routes/projects.js';
// import analysisRoutes from './routes/analysis.js';
// import scoringRoutes from './routes/scoring.js';
// import refactorRoutes from './routes/refactor.js';
// import architectureRoutes from './routes/architecture.js';
// import reportRoutes from './routes/reports.js';

// Use routes
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);
// app.use('/api/analyze', analysisRoutes);
// app.use('/api/scores', scoringRoutes);
// app.use('/api/refactor', refactorRoutes);
// app.use('/api/architecture', architectureRoutes);
// app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
