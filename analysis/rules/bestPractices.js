import traverse from '@babel/traverse';

/**
 * Best practices and code quality rules
 */
export const checkBestPractices = (ast, code) => {
    const issues = [];

    traverse.default(ast, {
        // Detect empty catch blocks
        CatchClause(path) {
            const body = path.node.body;
            if (body.body.length === 0) {
                issues.push({
                    category: 'code-quality',
                    severity: 'medium',
                    title: 'Empty catch block',
                    description: 'Empty catch blocks silently swallow errors, making debugging difficult.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Log the error or handle it appropriately. At minimum, add a comment explaining why it\'s empty.',
                    ruleId: 'no-empty-catch',
                    source: 'static-analysis'
                });
            }
        },

        // Detect unused variables (basic check)
        VariableDeclarator(path) {
            const binding = path.scope.getBinding(path.node.id.name);
            if (binding && binding.references === 0 && !path.node.id.name.startsWith('_')) {
                issues.push({
                    category: 'code-quality',
                    severity: 'low',
                    title: `Unused variable '${path.node.id.name}'`,
                    description: 'This variable is declared but never used.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Remove unused variables or prefix with underscore if intentionally unused.',
                    ruleId: 'no-unused-vars',
                    source: 'static-analysis'
                });
            }
        },

        // Detect var usage (should use let/const)
        VariableDeclaration(path) {
            if (path.node.kind === 'var') {
                issues.push({
                    category: 'code-quality',
                    severity: 'low',
                    title: 'Use of var keyword',
                    description: 'var has function scope which can lead to unexpected behavior. Use let or const instead.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Use const for values that don\'t change, let for variables that do.',
                    ruleId: 'no-var',
                    source: 'static-analysis'
                });
            }
        },

        // Detect console.log left in code
        CallExpression(path) {
            const callee = path.node.callee;
            if (callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'console') {
                // Already handled by debugCode.js, skip
            }
        },

        // Detect nested ternaries
        ConditionalExpression(path) {
            const consequent = path.node.consequent;
            const alternate = path.node.alternate;

            if (consequent.type === 'ConditionalExpression' ||
                alternate.type === 'ConditionalExpression') {
                issues.push({
                    category: 'code-quality',
                    severity: 'medium',
                    title: 'Nested ternary expression',
                    description: 'Nested ternary expressions are hard to read and understand.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Use if-else statements or extract logic into a separate function.',
                    ruleId: 'no-nested-ternary',
                    source: 'static-analysis'
                });
            }
        },

        // Detect deeply nested code (more than 4 levels)
        enter(path) {
            let depth = 0;
            let current = path;

            while (current.parentPath) {
                if (['IfStatement', 'ForStatement', 'WhileStatement', 'DoWhileStatement',
                    'SwitchStatement', 'TryStatement', 'FunctionDeclaration',
                    'ArrowFunctionExpression', 'FunctionExpression'].includes(current.node.type)) {
                    depth++;
                }
                current = current.parentPath;
            }

            if (depth > 4 && ['IfStatement', 'ForStatement', 'WhileStatement'].includes(path.node.type)) {
                // Check if we haven't already reported this
                const key = `${path.node.loc.start.line}-${path.node.loc.start.column}`;
                if (!this._reportedDeepNesting) this._reportedDeepNesting = new Set();

                if (!this._reportedDeepNesting.has(key)) {
                    this._reportedDeepNesting.add(key);
                    issues.push({
                        category: 'maintainability',
                        severity: 'medium',
                        title: 'Deeply nested code',
                        description: `Code is nested ${depth} levels deep. Deep nesting makes code hard to follow.`,
                        lineNumber: {
                            start: path.node.loc.start.line,
                            end: path.node.loc.end.line
                        },
                        suggestion: 'Consider using early returns, extracting functions, or simplifying logic.',
                        ruleId: 'max-depth',
                        source: 'static-analysis'
                    });
                }
            }
        },

        // Detect == and != (should use === and !==)
        BinaryExpression(path) {
            if (path.node.operator === '==' || path.node.operator === '!=') {
                issues.push({
                    category: 'code-quality',
                    severity: 'low',
                    title: `Use of ${path.node.operator} operator`,
                    description: 'Loose equality can lead to unexpected type coercion.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: `Use ${path.node.operator === '==' ? '===' : '!=='} for strict equality comparison.`,
                    ruleId: 'eqeqeq',
                    source: 'static-analysis'
                });
            }
        }
    });

    return issues;
};

/**
 * Check for TODO/FIXME/HACK comments
 */
export const checkTodoComments = (code) => {
    const issues = [];
    const lines = code.split('\n');
    const patterns = [
        { regex: /\/\/\s*(TODO|FIXME|HACK|XXX|BUG):/i, severity: 'low' },
        { regex: /\/\*\s*(TODO|FIXME|HACK|XXX|BUG):/i, severity: 'low' }
    ];

    lines.forEach((line, index) => {
        patterns.forEach(({ regex, severity }) => {
            const match = line.match(regex);
            if (match) {
                issues.push({
                    category: 'maintainability',
                    severity,
                    title: `${match[1].toUpperCase()} comment found`,
                    description: `This code has a ${match[1]} comment that needs attention.`,
                    lineNumber: {
                        start: index + 1,
                        end: index + 1
                    },
                    suggestion: 'Address the TODO/FIXME before releasing to production.',
                    ruleId: 'no-warning-comments',
                    source: 'static-analysis'
                });
            }
        });
    });

    return issues;
};

/**
 * Check for potential performance issues
 */
export const checkPerformance = (ast, code) => {
    const issues = [];

    traverse.default(ast, {
        // Detect array methods inside loops (potential O(n²))
        ForStatement(path) {
            path.traverse({
                CallExpression(innerPath) {
                    const callee = innerPath.node.callee;
                    if (callee.type === 'MemberExpression' &&
                        callee.property.type === 'Identifier') {
                        const method = callee.property.name;
                        const expensiveMethods = ['find', 'filter', 'indexOf', 'includes', 'some', 'every'];

                        if (expensiveMethods.includes(method)) {
                            issues.push({
                                category: 'performance',
                                severity: 'medium',
                                title: `Array method '${method}' inside loop`,
                                description: 'Using array search methods inside loops can lead to O(n²) complexity.',
                                lineNumber: {
                                    start: innerPath.node.loc.start.line,
                                    end: innerPath.node.loc.end.line
                                },
                                suggestion: 'Consider using a Set or Map for O(1) lookups, or move the search outside the loop.',
                                ruleId: 'no-nested-array-methods',
                                source: 'static-analysis'
                            });
                        }
                    }
                }
            });
        },

        // Detect synchronous fs operations
        CallExpression(path) {
            const callee = path.node.callee;
            if (callee.type === 'MemberExpression' &&
                callee.property.type === 'Identifier') {
                const syncMethods = ['readFileSync', 'writeFileSync', 'appendFileSync',
                    'existsSync', 'mkdirSync', 'readdirSync'];
                if (syncMethods.includes(callee.property.name)) {
                    issues.push({
                        category: 'performance',
                        severity: 'low',
                        title: `Synchronous file operation: ${callee.property.name}`,
                        description: 'Synchronous file operations block the event loop.',
                        lineNumber: {
                            start: path.node.loc.start.line,
                            end: path.node.loc.end.line
                        },
                        suggestion: 'Use async versions with fs.promises or callbacks for better performance.',
                        ruleId: 'no-sync-fs',
                        source: 'static-analysis'
                    });
                }
            }
        }
    });

    return issues;
};
