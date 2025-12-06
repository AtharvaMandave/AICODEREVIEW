import traverse from '@babel/traverse';

/**
 * Detect magic numbers (hardcoded numeric values)
 */
export const checkMagicNumbers = (ast, code) => {
    const issues = [];
    const ALLOWED_NUMBERS = [0, 1, -1, 2, 10, 100, 1000]; // Common acceptable numbers

    traverse.default(ast, {
        NumericLiteral(path) {
            const value = path.node.value;

            // Skip allowed numbers
            if (ALLOWED_NUMBERS.includes(value)) return;

            // Skip if it's in an array index
            if (path.parent.type === 'MemberExpression' && path.parent.property === path.node) return;

            // Skip if it's a default parameter
            if (path.parent.type === 'AssignmentPattern') return;

            // Skip if it's already in a const declaration
            const parent = path.findParent(p => p.isVariableDeclarator());
            if (parent && parent.parent.kind === 'const') return;

            issues.push({
                category: 'maintainability',
                severity: 'low',
                title: `Magic number: ${value}`,
                description: `Found hardcoded number ${value}. Magic numbers make code harder to understand and maintain.`,
                lineNumber: {
                    start: path.node.loc.start.line,
                    end: path.node.loc.end.line
                },
                codeSnippet: code.split('\n')[path.node.loc.start.line - 1]?.trim(),
                suggestion: `Extract this number into a named constant:\nconst MEANINGFUL_NAME = ${value};`,
                ruleId: 'no-magic-numbers',
                source: 'static-analysis'
            });
        }
    });

    return issues;
};
