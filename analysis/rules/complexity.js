import escomplex from 'escomplex';

/**
 * Calculate cyclomatic complexity for JavaScript code
 */
export const checkComplexity = (code, filePath) => {
    const issues = [];
    const MAX_COMPLEXITY = 10;

    try {
        const report = escomplex.analyse(code, {
            loc: true,
            newmi: true
        });

        // Check each function's complexity
        for (const func of report.functions) {
            if (func.cyclomatic > MAX_COMPLEXITY) {
                issues.push({
                    category: 'maintainability',
                    severity: func.cyclomatic > 20 ? 'high' : 'medium',
                    title: `High cyclomatic complexity in function '${func.name}'`,
                    description: `This function has a cyclomatic complexity of ${func.cyclomatic}. High complexity makes code harder to test and maintain.`,
                    lineNumber: {
                        start: func.line,
                        end: func.line
                    },
                    suggestion: `Reduce complexity by:\n- Extracting conditional logic into separate functions\n- Using early returns\n- Simplifying nested conditions\n- Breaking down complex logic into smaller pieces`,
                    ruleId: 'cyclomatic-complexity',
                    source: 'static-analysis',
                    metadata: {
                        complexity: func.cyclomatic,
                        halsteadDifficulty: func.halstead?.difficulty,
                        params: func.params
                    }
                });
            }
        }

        // Check overall file complexity
        if (report.aggregate.cyclomatic > 50) {
            issues.push({
                category: 'maintainability',
                severity: 'medium',
                title: 'High overall file complexity',
                description: `This file has an aggregate cyclomatic complexity of ${report.aggregate.cyclomatic}. Consider refactoring.`,
                lineNumber: {
                    start: 1,
                    end: 1
                },
                suggestion: 'Break this file into smaller modules with focused responsibilities.',
                ruleId: 'file-complexity',
                source: 'static-analysis'
            });
        }

    } catch (error) {
        console.error(`Complexity analysis error in ${filePath}:`, error.message);
    }

    return issues;
};
