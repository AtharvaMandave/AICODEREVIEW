/**
 * Detect functions that are too long (> 50 lines)
 */
export const checkFunctionSize = (functions, code) => {
    const issues = [];
    const MAX_LINES = 50;

    for (const func of functions) {
        if (!func.loc) continue;

        const startLine = func.loc.start.line;
        const endLine = func.loc.end.line;
        const lineCount = endLine - startLine + 1;

        if (lineCount > MAX_LINES) {
            issues.push({
                category: 'maintainability',
                severity: lineCount > 100 ? 'high' : 'medium',
                title: `Function '${func.name}' is too long`,
                description: `This function has ${lineCount} lines. Functions should ideally be under ${MAX_LINES} lines for better maintainability.`,
                lineNumber: {
                    start: startLine,
                    end: endLine
                },
                suggestion: 'Consider breaking this function into smaller, more focused functions. Each function should do one thing well.',
                ruleId: 'function-size',
                source: 'static-analysis'
            });
        }
    }

    return issues;
};

/**
 * Detect classes that are too large (> 300 lines or > 20 methods)
 */
export const checkClassSize = (classes, code) => {
    const issues = [];
    const MAX_LINES = 300;
    const MAX_METHODS = 20;

    for (const cls of classes) {
        if (!cls.loc) continue;

        const startLine = cls.loc.start.line;
        const endLine = cls.loc.end.line;
        const lineCount = endLine - startLine + 1;
        const methodCount = cls.methods.length;

        if (lineCount > MAX_LINES || methodCount > MAX_METHODS) {
            issues.push({
                category: 'architecture',
                severity: 'high',
                title: `Class '${cls.name}' is too large`,
                description: `This class has ${lineCount} lines and ${methodCount} methods. Large classes are hard to maintain and often violate the Single Responsibility Principle.`,
                lineNumber: {
                    start: startLine,
                    end: endLine
                },
                suggestion: 'Consider splitting this class into smaller, more focused classes. Each class should have a single, well-defined responsibility.',
                ruleId: 'class-size',
                source: 'static-analysis'
            });
        }
    }

    return issues;
};
