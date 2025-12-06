import { logger } from '../utils/logger.js';

/**
 * Merge static analysis and AI review results
 */
export const mergeResults = (staticIssues, aiIssues) => {
    const allIssues = [...staticIssues, ...aiIssues];

    // Sort by severity and file path
    const severityOrder = { high: 0, medium: 1, low: 2 };

    allIssues.sort((a, b) => {
        // First by severity
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;

        // Then by file path
        return a.filePath.localeCompare(b.filePath);
    });

    logger.info(`Merged ${staticIssues.length} static + ${aiIssues.length} AI issues = ${allIssues.length} total`);

    return allIssues;
};

/**
 * Calculate AI review score based on issues found
 */
export const calculateAIScore = (aiIssues) => {
    if (aiIssues.length === 0) return 100;

    const highCount = aiIssues.filter(i => i.severity === 'high').length;
    const mediumCount = aiIssues.filter(i => i.severity === 'medium').length;
    const lowCount = aiIssues.filter(i => i.severity === 'low').length;

    // Weighted penalty system
    const penalty = (highCount * 12) + (mediumCount * 6) + (lowCount * 2);
    const score = Math.max(0, 100 - penalty);

    return Math.round(score);
};

/**
 * Generate summary statistics from merged results
 */
export const generateSummary = (staticIssues, aiIssues, files) => {
    const allIssues = [...staticIssues, ...aiIssues];

    return {
        totalIssues: allIssues.length,
        staticIssues: staticIssues.length,
        aiIssues: aiIssues.length,
        issuesBySeverity: {
            high: allIssues.filter(i => i.severity === 'high').length,
            medium: allIssues.filter(i => i.severity === 'medium').length,
            low: allIssues.filter(i => i.severity === 'low').length
        },
        issuesByCategory: allIssues.reduce((acc, issue) => {
            acc[issue.category] = (acc[issue.category] || 0) + 1;
            return acc;
        }, {}),
        issuesBySource: {
            static: staticIssues.length,
            ai: aiIssues.length
        },
        filesAnalyzed: files.length,
        totalLines: files.reduce((sum, f) => sum + f.lines, 0)
    };
};
