import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: [
            'code-quality',
            'security',
            'performance',
            'architecture',
            'design-pattern',
            'maintainability',
            'readability'
        ],
        required: true
    },
    severity: {
        type: String,
        enum: ['high', 'medium', 'low'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    lineNumber: {
        start: Number,
        end: Number
    },
    codeSnippet: String,
    suggestion: String,
    source: {
        type: String,
        enum: ['static-analysis', 'ai-review'],
        required: true
    },
    ruleId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
issueSchema.index({ projectId: 1, severity: 1 });
issueSchema.index({ projectId: 1, category: 1 });
issueSchema.index({ projectId: 1, filePath: 1 });

export default mongoose.model('Issue', issueSchema);
