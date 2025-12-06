import { analyzeProject } from '../../../analysis/runner/analyzer.js';

/**
 * Run static analysis on project files
 */
export const runStaticAnalysis = async (files) => {
    try {
        const { results, summary } = analyzeProject(files);

        return {
            success: true,
            results,
            summary
        };
    } catch (error) {
        throw new Error(`Static analysis failed: ${error.message}`);
    }
};
