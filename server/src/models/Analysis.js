import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        unique: true
    },
    // Architecture Analysis
    architecture: {
        pattern: String, // 'mvc', 'microservices', 'monolith', 'layered', etc.
        quality: String, // 'excellent', 'good', 'needs-improvement', 'poor'
        issues: [String],
        suggestions: [String],
        dependencyGraph: mongoose.Schema.Types.Mixed, // Mermaid syntax
        circularDependencies: [{
            files: [String],
            description: String
        }]
    },
    // Refactored Code
    refactoredFiles: [{
        filePath: String,
        originalCode: String,
        refactoredCode: String,
        diff: String,
        improvements: [String]
    }],
    // Analysis Summary
    summary: {
        totalFiles: Number,
        analyzedFiles: Number,
        skippedFiles: Number,
        errors: [String]
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Analysis', analysisSchema);
