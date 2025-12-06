// Severity levels
export const SEVERITY = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

// Issue categories
export const CATEGORY = {
    CODE_QUALITY: 'code-quality',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    ARCHITECTURE: 'architecture',
    DESIGN_PATTERN: 'design-pattern',
    MAINTAINABILITY: 'maintainability',
    READABILITY: 'readability'
};

// Analysis status
export const STATUS = {
    UPLOADED: 'uploaded',
    ANALYZING: 'analyzing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// Source types
export const SOURCE_TYPE = {
    FILE: 'file',
    ZIP: 'zip',
    GITHUB: 'github'
};

// Analysis sources
export const ANALYSIS_SOURCE = {
    STATIC: 'static-analysis',
    AI: 'ai-review'
};
