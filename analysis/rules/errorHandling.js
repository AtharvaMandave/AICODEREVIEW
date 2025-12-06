import traverse from '@babel/traverse';

/**
 * Detect missing error handling in async functions
 */
export const checkErrorHandling = (ast, code) => {
    const issues = [];

    traverse.default(ast, {
        // Check async functions for try-catch
        FunctionDeclaration(path) {
            if (!path.node.async) return;

            const hasTryCatch = checkForTryCatch(path);

            if (!hasTryCatch) {
                issues.push({
                    category: 'code-quality',
                    severity: 'medium',
                    title: `Async function '${path.node.id?.name || 'anonymous'}' missing error handling`,
                    description: 'Async functions should have try-catch blocks to handle potential errors.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Wrap async code in try-catch blocks or use .catch() on promises.',
                    ruleId: 'async-error-handling',
                    source: 'static-analysis'
                });
            }
        },

        ArrowFunctionExpression(path) {
            if (!path.node.async) return;

            const hasTryCatch = checkForTryCatch(path);

            if (!hasTryCatch) {
                const parent = path.parent;
                const name = parent.type === 'VariableDeclarator' ? parent.id.name : 'anonymous';

                issues.push({
                    category: 'code-quality',
                    severity: 'medium',
                    title: `Async function '${name}' missing error handling`,
                    description: 'Async functions should have try-catch blocks to handle potential errors.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Wrap async code in try-catch blocks or use .catch() on promises.',
                    ruleId: 'async-error-handling',
                    source: 'static-analysis'
                });
            }
        },

        // Check for unhandled promise rejections
        CallExpression(path) {
            const callee = path.node.callee;

            // Check if it's a .then() without .catch()
            if (callee.type === 'MemberExpression' &&
                callee.property.name === 'then') {

                // Look for a chained .catch()
                let hasCatch = false;
                let current = path.parentPath;

                while (current) {
                    if (current.node.type === 'CallExpression' &&
                        current.node.callee.type === 'MemberExpression' &&
                        current.node.callee.property.name === 'catch') {
                        hasCatch = true;
                        break;
                    }
                    current = current.parentPath;
                }

                if (!hasCatch) {
                    issues.push({
                        category: 'code-quality',
                        severity: 'low',
                        title: 'Promise without .catch()',
                        description: 'Promise chains should include .catch() to handle rejections.',
                        lineNumber: {
                            start: path.node.loc.start.line,
                            end: path.node.loc.end.line
                        },
                        suggestion: 'Add .catch() to handle promise rejections or use try-catch with await.',
                        ruleId: 'promise-error-handling',
                        source: 'static-analysis'
                    });
                }
            }
        }
    });

    return issues;
};

/**
 * Helper: Check if a function contains try-catch
 */
const checkForTryCatch = (path) => {
    let hasTryCatch = false;

    path.traverse({
        TryStatement() {
            hasTryCatch = true;
        }
    });

    return hasTryCatch;
};
