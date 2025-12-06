import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        unique: true
    },
    // Overall Developer Score (0-100)
    overallScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    // Category Scores
    maintainabilityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    readabilityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    securityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    architectureScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    performanceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    // Component Scores (used in formula)
    staticAnalysisScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    aiReviewScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    // Metrics
    metrics: {
        totalIssues: Number,
        highSeverityIssues: Number,
        mediumSeverityIssues: Number,
        lowSeverityIssues: Number,
        avgFunctionSize: Number,
        avgComplexity: Number,
        codeSmells: Number,
        securityVulnerabilities: Number
    },
    calculatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Score', scoreSchema);
