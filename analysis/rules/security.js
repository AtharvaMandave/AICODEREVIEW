import traverse from '@babel/traverse';

/**
 * Security vulnerability detection rules
 */
export const checkSecurity = (ast, code) => {
    const issues = [];

    traverse.default(ast, {
        // Detect eval() usage
        CallExpression(path) {
            const callee = path.node.callee;

            // Direct eval() call
            if (callee.type === 'Identifier' && callee.name === 'eval') {
                issues.push({
                    category: 'security',
                    severity: 'high',
                    title: 'Dangerous eval() usage detected',
                    description: 'eval() executes arbitrary code and can lead to code injection attacks.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Avoid using eval(). Consider using JSON.parse() for JSON data or Function constructor for dynamic code.',
                    ruleId: 'no-eval',
                    source: 'static-analysis'
                });
            }

            // new Function() is also dangerous
            if (callee.type === 'Identifier' && callee.name === 'Function') {
                issues.push({
                    category: 'security',
                    severity: 'high',
                    title: 'Dangerous Function constructor usage',
                    description: 'new Function() is similar to eval() and can execute arbitrary code.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Avoid using the Function constructor with dynamic strings.',
                    ruleId: 'no-new-function',
                    source: 'static-analysis'
                });
            }

            // setTimeout/setInterval with string argument
            if (callee.type === 'Identifier' &&
                (callee.name === 'setTimeout' || callee.name === 'setInterval')) {
                const firstArg = path.node.arguments[0];
                if (firstArg && firstArg.type === 'StringLiteral') {
                    issues.push({
                        category: 'security',
                        severity: 'medium',
                        title: `${callee.name}() with string argument`,
                        description: 'Passing a string to setTimeout/setInterval is similar to eval().',
                        lineNumber: {
                            start: path.node.loc.start.line,
                            end: path.node.loc.end.line
                        },
                        suggestion: 'Pass a function reference instead of a string.',
                        ruleId: 'no-implied-eval',
                        source: 'static-analysis'
                    });
                }
            }
        },

        // Detect innerHTML usage (XSS vulnerability)
        AssignmentExpression(path) {
            const left = path.node.left;
            if (left.type === 'MemberExpression' &&
                left.property.type === 'Identifier' &&
                left.property.name === 'innerHTML') {
                issues.push({
                    category: 'security',
                    severity: 'high',
                    title: 'Potential XSS vulnerability: innerHTML assignment',
                    description: 'Direct innerHTML assignment can lead to Cross-Site Scripting (XSS) attacks.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Use textContent for text, or sanitize HTML with DOMPurify before using innerHTML.',
                    ruleId: 'no-inner-html',
                    source: 'static-analysis'
                });
            }

            // Also check outerHTML
            if (left.type === 'MemberExpression' &&
                left.property.type === 'Identifier' &&
                left.property.name === 'outerHTML') {
                issues.push({
                    category: 'security',
                    severity: 'high',
                    title: 'Potential XSS vulnerability: outerHTML assignment',
                    description: 'Direct outerHTML assignment can lead to XSS attacks.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Sanitize HTML content before assignment.',
                    ruleId: 'no-outer-html',
                    source: 'static-analysis'
                });
            }
        },

        // Detect hardcoded secrets
        VariableDeclarator(path) {
            const init = path.node.init;
            const id = path.node.id;

            if (id.type === 'Identifier' && init && init.type === 'StringLiteral') {
                const name = id.name.toLowerCase();
                const value = init.value;

                // Check for common secret patterns
                const secretPatterns = [
                    'password', 'passwd', 'pwd', 'secret', 'apikey', 'api_key',
                    'token', 'auth', 'credential', 'private_key', 'privatekey'
                ];

                const isSecretName = secretPatterns.some(pattern => name.includes(pattern));
                const looksLikeSecret = value.length > 10 && /^[A-Za-z0-9_\-\.]+$/.test(value);

                if (isSecretName && looksLikeSecret) {
                    issues.push({
                        category: 'security',
                        severity: 'high',
                        title: `Potential hardcoded secret in '${id.name}'`,
                        description: 'Hardcoded secrets in source code can be exposed if the code is shared.',
                        lineNumber: {
                            start: path.node.loc.start.line,
                            end: path.node.loc.end.line
                        },
                        suggestion: 'Use environment variables to store secrets (process.env.SECRET_NAME).',
                        ruleId: 'no-hardcoded-secrets',
                        source: 'static-analysis'
                    });
                }
            }
        },

        // Detect SQL injection patterns (template literals in query-like contexts)
        TaggedTemplateExpression(path) {
            const tag = path.node.tag;
            if (tag.type === 'Identifier') {
                const sqlPatterns = ['sql', 'query', 'execute', 'raw'];
                if (sqlPatterns.some(p => tag.name.toLowerCase().includes(p))) {
                    const quasi = path.node.quasi;
                    if (quasi.expressions.length > 0) {
                        issues.push({
                            category: 'security',
                            severity: 'medium',
                            title: 'Potential SQL injection risk',
                            description: 'Interpolating variables in SQL queries may lead to SQL injection.',
                            lineNumber: {
                                start: path.node.loc.start.line,
                                end: path.node.loc.end.line
                            },
                            suggestion: 'Use parameterized queries or prepared statements instead.',
                            ruleId: 'sql-injection-risk',
                            source: 'static-analysis'
                        });
                    }
                }
            }
        },

        // Detect document.write (XSS risk)
        CallExpression(path) {
            const callee = path.node.callee;
            if (callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'document' &&
                callee.property.type === 'Identifier' &&
                (callee.property.name === 'write' || callee.property.name === 'writeln')) {
                issues.push({
                    category: 'security',
                    severity: 'medium',
                    title: 'document.write() usage detected',
                    description: 'document.write() can be used for XSS attacks and blocks page rendering.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Use DOM manipulation methods like createElement and appendChild instead.',
                    ruleId: 'no-document-write',
                    source: 'static-analysis'
                });
            }
        }
    });

    return issues;
};

/**
 * Detect insecure dependencies patterns
 */
export const checkInsecurePatterns = (ast, code) => {
    const issues = [];

    traverse.default(ast, {
        // Check for http:// URLs (should use https://)
        StringLiteral(path) {
            const value = path.node.value;
            if (value.startsWith('http://') && !value.includes('localhost') && !value.includes('127.0.0.1')) {
                issues.push({
                    category: 'security',
                    severity: 'low',
                    title: 'Insecure HTTP URL detected',
                    description: 'Using HTTP instead of HTTPS can expose data to man-in-the-middle attacks.',
                    lineNumber: {
                        start: path.node.loc.start.line,
                        end: path.node.loc.end.line
                    },
                    suggestion: 'Use HTTPS for all external URLs.',
                    ruleId: 'prefer-https',
                    source: 'static-analysis'
                });
            }
        },

        // Check for disabled security features
        AssignmentExpression(path) {
            const right = path.node.right;
            const left = path.node.left;

            // Check for disabling SSL verification
            if (left.type === 'MemberExpression' &&
                left.property.type === 'Identifier') {
                const propName = left.property.name.toLowerCase();
                if ((propName.includes('rejectunauthorized') || propName.includes('verify')) &&
                    right.type === 'BooleanLiteral' && right.value === false) {
                    issues.push({
                        category: 'security',
                        severity: 'high',
                        title: 'SSL/TLS verification disabled',
                        description: 'Disabling SSL verification makes connections vulnerable to MITM attacks.',
                        lineNumber: {
                            start: path.node.loc.start.line,
                            end: path.node.loc.end.line
                        },
                        suggestion: 'Enable SSL verification in production.',
                        ruleId: 'ssl-verification-disabled',
                        source: 'static-analysis'
                    });
                }
            }
        }
    });

    return issues;
};
