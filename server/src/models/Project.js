import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    sourceType: {
        type: String,
        enum: ['file', 'zip', 'github'],
        required: true
    },
    githubUrl: String,
    uploadPath: {
        type: String,
        required: true
    },
    fileCount: {
        type: Number,
        default: 0
    },
    totalLines: {
        type: Number,
        default: 0
    },
    languages: [{
        language: String,
        fileCount: Number,
        lineCount: Number
    }],
    status: {
        type: String,
        enum: ['uploaded', 'analyzing', 'completed', 'failed'],
        default: 'uploaded'
    },
    error: String,
    analysisProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
projectSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Project', projectSchema);
