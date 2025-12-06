/**
 * Calculate developer score based on analysis results
 * Formula: 40% static + 40% AI + 20% architecture
 */
export const calculateDeveloperScore = (staticScore, aiScore, architectureScore) => {
    return (
        staticScore * 0.4 +
        aiScore * 0.4 +
        architectureScore * 0.2
    );
};

/**
 * Calculate static analysis score (0-100)
 */
export const calculateStaticScore = (summary) => {
    const { totalIssues, issuesBySeverity } = summary;

    if (totalIssues === 0) return 100;

    // Weighted penalty system
    const highPenalty = issuesBySeverity.high * 10;
    const mediumPenalty = issuesBySeverity.medium * 5;
    const lowPenalty = issuesBySeverity.low * 2;

    const totalPenalty = highPenalty + mediumPenalty + lowPenalty;
    const score = Math.max(0, 100 - totalPenalty);

    return Math.round(score);
};

/**
 * Calculate category scores
 */
export const calculateCategoryScores = (issues) => {
    const categories = {
        maintainability: [],
        readability: [],
        security: [],
        performance: [],
        architecture: []
    };

    // Group issues by category
    for (const issue of issues) {
        if (categories[issue.category]) {
            categories[issue.category].push(issue);
        }
    }

    // Calculate score for each category
    const scores = {};
    for (const [category, categoryIssues] of Object.entries(categories)) {
        const highCount = categoryIssues.filter(i => i.severity === 'high').length;
        const mediumCount = categoryIssues.filter(i => i.severity === 'medium').length;
        const lowCount = categoryIssues.filter(i => i.severity === 'low').length;

        const penalty = (highCount * 15) + (mediumCount * 8) + (lowCount * 3);
        scores[category] = Math.max(0, Math.min(100, 100 - penalty));
    }

    return scores;
};

/**
 * Calculate metrics from issues
 */
export const calculateMetrics = (issues, files) => {
    const totalIssues = issues.length;
    const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;
    const lowSeverityIssues = issues.filter(i => i.severity === 'low').length;

    // Calculate average function size and complexity from metadata
    let totalFunctionSize = 0;
    let totalComplexity = 0;
    let functionCount = 0;
    let complexityCount = 0;

    for (const issue of issues) {
        if (issue.metadata?.functionSize) {
            totalFunctionSize += issue.metadata.functionSize;
            functionCount++;
        }
        if (issue.metadata?.complexity) {
            totalComplexity += issue.metadata.complexity;
            complexityCount++;
        }
    }

    return {
        totalIssues,
        highSeverityIssues,
        mediumSeverityIssues,
        lowSeverityIssues,
        avgFunctionSize: functionCount > 0 ? Math.round(totalFunctionSize / functionCount) : 0,
        avgComplexity: complexityCount > 0 ? Math.round(totalComplexity / complexityCount) : 0,
        codeSmells: issues.filter(i => i.category === 'code-quality').length,
        securityVulnerabilities: issues.filter(i => i.category === 'security').length
    };
};
