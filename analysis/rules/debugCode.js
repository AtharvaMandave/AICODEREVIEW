import traverse from '@babel/traverse';

/**
 * Detect console.log and other debug statements
 */
export const checkDebugCode = (ast, code) => {
    const issues = [];

    traverse.default(ast, {
        CallExpression(path) {
            const callee = path.node.callee;

            // Check for console.log, console.warn, console.error, etc.
            if (callee.type === 'MemberExpression' &&
                callee.object.name === 'console') {

                const method = callee.property.name;

                issues.push({
                    category: 'code-quality',
                    severity: 'low',
                    title: `Debug statement: console.${method}()`,
                    description: `Found console.${method}() call. Debug statements should be removed before production.`,
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    codeSnippet: code.split('\n')[path.node.loc.start.line - 1]?.trim(),
                    suggestion: 'Remove console statements or use a proper logging library with log levels.',
                    ruleId: 'no-console',
                    source: 'static-analysis'
                });
            }

            // Check for debugger statements
            if (path.node.type === 'DebuggerStatement') {
                issues.push({
                    category: 'code-quality',
                    severity: 'medium',
                    title: 'Debugger statement found',
                    description: 'Debugger statements should not be committed to production code.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Remove debugger statements before committing.',
                    ruleId: 'no-debugger',
                    source: 'static-analysis'
                });
            }
        },

        DebuggerStatement(path) {
            issues.push({
                category: 'code-quality',
                severity: 'medium',
                title: 'Debugger statement found',
                description: 'Debugger statements should not be committed to production code.',
                lineNumber: {
                    start: path.node.loc.start.line,
                    end: path.node.loc.end.line
                },
                suggestion: 'Remove debugger statements before committing.',
                ruleId: 'no-debugger',
                source: 'static-analysis'
            });
        }
    });

    return issues;
};
