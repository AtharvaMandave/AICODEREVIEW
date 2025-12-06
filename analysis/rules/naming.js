import traverse from '@babel/traverse';

/**
 * Check variable and function naming conventions
 */
export const checkNaming = (ast, code) => {
    const issues = [];

    traverse.default(ast, {
        VariableDeclarator(path) {
            const name = path.node.id.name;

            // Skip if it's a destructuring pattern
            if (path.node.id.type !== 'Identifier') return;

            // Check for single-letter variables (except common loop counters)
            if (name.length === 1 && !['i', 'j', 'k', 'x', 'y', 'z', '_'].includes(name)) {
                issues.push({
                    category: 'readability',
                    severity: 'low',
                    title: `Single-letter variable name '${name}'`,
                    description: `Variable '${name}' has a non-descriptive single-letter name.`,
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Use descriptive variable names that clearly indicate the purpose or content of the variable.',
                    ruleId: 'naming-convention',
                    source: 'static-analysis'
                });
            }

            // Check for all uppercase (should be constants)
            if (name === name.toUpperCase() && name.length > 1) {
                const parent = path.parent;
                if (parent.type === 'VariableDeclaration' && parent.kind !== 'const') {
                    issues.push({
                        category: 'readability',
                        severity: 'low',
                        title: `Uppercase variable '${name}' should be const`,
                        description: `Variable '${name}' uses uppercase naming but is not declared as const.`,
                        lineNumber: {
                            start: path.node.loc.start.line,
                            end: path.node.loc.end.line
                        },
                        suggestion: 'Use const for constants with uppercase names, or use camelCase for regular variables.',
                        ruleId: 'naming-convention',
                        source: 'static-analysis'
                    });
                }
            }
        },

        FunctionDeclaration(path) {
            const name = path.node.id?.name;
            if (!name) return;

            // Check if function name starts with lowercase (convention)
            if (name[0] !== name[0].toLowerCase() && !name.startsWith('_')) {
                issues.push({
                    category: 'readability',
                    severity: 'low',
                    title: `Function '${name}' should start with lowercase`,
                    description: `Function names should start with lowercase unless they are constructors.`,
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Use camelCase for function names (e.g., myFunction instead of MyFunction).',
                    ruleId: 'naming-convention',
                    source: 'static-analysis'
                });
            }
        },

        ClassDeclaration(path) {
            const name = path.node.id?.name;
            if (!name) return;

            // Check if class name starts with uppercase (convention)
            if (name[0] !== name[0].toUpperCase()) {
                issues.push({
                    category: 'readability',
                    severity: 'low',
                    title: `Class '${name}' should start with uppercase`,
                    description: `Class names should follow PascalCase convention.`,
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Use PascalCase for class names (e.g., MyClass instead of myClass).',
                    ruleId: 'naming-convention',
                    source: 'static-analysis'
                });
            }
        }
    });

    return issues;
};
