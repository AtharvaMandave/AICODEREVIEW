import { parseJavaScript, extractFunctions, extractClasses, extractImports, extractExports } from '../parsers/jsParser.js';
import { checkFunctionSize, checkClassSize } from '../rules/functionSize.js';
import { checkComplexity } from '../rules/complexity.js';
import { checkNaming } from '../rules/naming.js';
import { checkDebugCode } from '../rules/debugCode.js';
import { checkMagicNumbers } from '../rules/magicNumbers.js';
import { checkErrorHandling } from '../rules/errorHandling.js';

/**
 * Run static analysis on a single file
 */
export const analyzeFile = (filePath, code) => {
    const issues = [];
    const metadata = {
        filePath,
        language: getLanguage(filePath),
        lineCount: code.split('\n').length,
        size: Buffer.byteLength(code, 'utf8')
    };

    try {
        // Parse the file based on language
        if (isJavaScriptFile(filePath)) {
            const jsIssues = analyzeJavaScript(filePath, code);
            issues.push(...jsIssues);
        } else if (isPythonFile(filePath)) {
            // Python analysis will be added later
            console.log(`Python analysis not yet implemented for ${filePath}`);
        }

        return {
            filePath,
            issues,
            metadata
        };

    } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error.message);
        return {
            filePath,
            issues: [],
            metadata,
            error: error.message
        };
    }
};

/**
 * Analyze JavaScript/TypeScript file
 */
const analyzeJavaScript = (filePath, code) => {
    const allIssues = [];

    // Parse AST
    const ast = parseJavaScript(code, filePath);
    if (!ast) return allIssues;

    // Extract code elements
    const functions = extractFunctions(ast);
    const classes = extractClasses(ast);
    const imports = extractImports(ast);
    const exports = extractExports(ast);

    // Run all analysis rules
    try {
        // Function and class size
        allIssues.push(...checkFunctionSize(functions, code));
        allIssues.push(...checkClassSize(classes, code));

        // Complexity analysis
        allIssues.push(...checkComplexity(code, filePath));

        // Naming conventions
        allIssues.push(...checkNaming(ast, code));

        // Debug code
        allIssues.push(...checkDebugCode(ast, code));

        // Magic numbers
        allIssues.push(...checkMagicNumbers(ast, code));

        // Error handling
        allIssues.push(...checkErrorHandling(ast, code));

    } catch (error) {
        console.error(`Rule execution error in ${filePath}:`, error.message);
    }

    // Add file path to all issues
    return allIssues.map(issue => ({
        ...issue,
        filePath
    }));
};

/**
 * Analyze multiple files
 */
export const analyzeProject = (files) => {
    const results = [];
    const summary = {
        totalFiles: files.length,
        analyzedFiles: 0,
        totalIssues: 0,
        issuesBySeverity: {
            high: 0,
            medium: 0,
            low: 0
        },
        issuesByCategory: {}
    };

    for (const file of files) {
        const result = analyzeFile(file.path, file.content);
        results.push(result);

        if (!result.error) {
            summary.analyzedFiles++;
            summary.totalIssues += result.issues.length;

            // Count by severity
            for (const issue of result.issues) {
                summary.issuesBySeverity[issue.severity]++;

                // Count by category
                if (!summary.issuesByCategory[issue.category]) {
                    summary.issuesByCategory[issue.category] = 0;
                }
                summary.issuesByCategory[issue.category]++;
            }
        }
    }

    return {
        results,
        summary
    };
};

/**
 * Helper functions
 */
const isJavaScriptFile = (filePath) => {
    return /\.(js|jsx|ts|tsx)$/.test(filePath);
};

const isPythonFile = (filePath) => {
    return /\.py$/.test(filePath);
};

const getLanguage = (filePath) => {
    if (/\.(js|jsx)$/.test(filePath)) return 'JavaScript';
    if (/\.(ts|tsx)$/.test(filePath)) return 'TypeScript';
    if (/\.py$/.test(filePath)) return 'Python';
    if (/\.java$/.test(filePath)) return 'Java';
    if (/\.go$/.test(filePath)) return 'Go';
    if (/\.rs$/.test(filePath)) return 'Rust';
    return 'Unknown';
};
