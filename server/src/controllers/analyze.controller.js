import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Score from '../models/Score.js';
import Analysis from '../models/Analysis.js';
import { readDirectoryRecursive } from '../services/file-reader.service.js';
import { runStaticAnalysis } from '../services/ast.service.js';
import { reviewFile, analyzeArchitecture, detectAI, detectProjectAI } from '../services/ai-review.service.js';
import { mergeResults, calculateAIScore, generateSummary } from '../services/merge.service.js';
import { calculateStaticScore, calculateCategoryScores, calculateMetrics, calculateDeveloperScore } from '../utils/scoring.js';
import { getLanguageFromExtension } from '../services/file-reader.service.js';
import { logger } from '../utils/logger.js';

/**
 * Analyze project with Static Analysis + AI Review
 */
export const analyzeProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // Find project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Update status
        project.status = 'analyzing';
        project.analysisProgress = 5;
        await project.save();

        logger.info(`Starting analysis for project: ${project.name}`);

        // Read files
        const files = readDirectoryRecursive(project.uploadPath);
        project.analysisProgress = 15;
        await project.save();

        // Run static analysis
        logger.info('Running static analysis...');
        const { results: staticResults, summary: staticSummary } = await runStaticAnalysis(files);
        project.analysisProgress = 40;
        await project.save();

        // Run AI review on each file
        logger.info('Running AI review...');
        const aiIssues = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const language = getLanguageFromExtension(file.extension);

            // Only review supported languages
            if (['JavaScript', 'TypeScript', 'Python'].includes(language)) {
                try {
                    const fileAIIssues = await reviewFile(file.path, file.content, language);
                    aiIssues.push(...fileAIIssues);
                } catch (aiError) {
                    logger.error(`AI review failed for file ${file.path}:`, aiError);
                    // Continue with other files
                }
            }

            // Update progress
            const aiProgress = 40 + ((i + 1) / files.length) * 30;
            project.analysisProgress = Math.round(aiProgress);
            await project.save();
        }

        logger.info(`AI review complete: ${aiIssues.length} issues found`);
        project.analysisProgress = 70;
        await project.save();

        // Merge static and AI results
        const staticIssues = staticResults.flatMap(r => r.issues);
        const allIssues = mergeResults(staticIssues, aiIssues);

        // Save all issues to database
        const savedIssues = [];

        // First, clear existing issues for this project to avoid duplicates
        await Issue.deleteMany({ projectId: project._id });

        for (const issue of allIssues) {
            const issueDoc = new Issue({
                projectId: project._id,
                filePath: issue.filePath,
                category: issue.category,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                lineNumber: issue.lineNumber,
                codeSnippet: issue.codeSnippet,
                suggestion: issue.suggestion,
                source: issue.source,
                ruleId: issue.ruleId
            });
            await issueDoc.save();
            savedIssues.push(issueDoc);
        }

        project.analysisProgress = 80;
        await project.save();

        // Run architecture analysis
        logger.info('Analyzing architecture...');
        let architectureInsights = null;
        try {
            architectureInsights = await analyzeArchitecture(files, project.name);
            if (architectureInsights) {
                logger.info('Architecture analysis complete:', architectureInsights.pattern);
            } else {
                logger.warn('Architecture analysis returned null - check Gemini API key');
            }
        } catch (archError) {
            logger.error('Architecture analysis failed:', archError.message);
            logger.error('Full error:', archError);
            // Continue without architecture insights
        }

        project.analysisProgress = 85;
        await project.save();

        // Calculate scores
        const staticScore = calculateStaticScore(staticSummary);
        const aiScore = calculateAIScore(aiIssues);
        const architectureScore = architectureInsights ?
            (architectureInsights.quality === 'excellent' ? 95 :
                architectureInsights.quality === 'good' ? 80 :
                    architectureInsights.quality === 'needs-improvement' ? 60 : 40) : 75;

        const categoryScores = calculateCategoryScores(savedIssues);
        const metrics = calculateMetrics(savedIssues, files);
        const overallScore = calculateDeveloperScore(staticScore, aiScore, architectureScore);

        // Save scores
        logger.info('Saving scores...');
        await Score.findOneAndUpdate(
            { projectId: project._id },
            {
                projectId: project._id,
                overallScore: Math.round(overallScore),
                maintainabilityScore: categoryScores.maintainability || 100,
                readabilityScore: categoryScores.readability || 100,
                securityScore: categoryScores.security || 100,
                architectureScore: Math.round(architectureScore),
                performanceScore: categoryScores.performance || 100,
                staticAnalysisScore: staticScore,
                aiReviewScore: aiScore,
                metrics
            },
            { upsert: true, new: true }
        );

        // Save architecture analysis
        if (architectureInsights) {
            logger.info('Saving architecture analysis...');
            try {
                await Analysis.findOneAndUpdate(
                    { projectId: project._id },
                    {
                        projectId: project._id,
                        architecture: architectureInsights,
                        summary: {
                            totalFiles: files.length,
                            analyzedFiles: files.length,
                            skippedFiles: 0,
                            errors: []
                        }
                    },
                    { upsert: true, new: true }
                );
            } catch (saveError) {
                logger.error('Failed to save architecture analysis:', saveError);
                // Continue even if saving analysis fails
            }
        }

        project.analysisProgress = 95;
        await project.save();

        // Generate final summary
        const finalSummary = generateSummary(staticIssues, aiIssues, files);

        // Update project status
        project.status = 'completed';
        project.analysisProgress = 100;
        await project.save();

        logger.info(`Analysis completed for project: ${project.name}`);
        logger.info(`Total issues: ${finalSummary.totalIssues} (${finalSummary.staticIssues} static + ${finalSummary.aiIssues} AI)`);

        res.json({
            success: true,
            message: 'Analysis completed successfully',
            project: {
                id: project._id,
                name: project.name,
                status: project.status
            },
            summary: finalSummary,
            scores: {
                overall: Math.round(overallScore),
                static: staticScore,
                ai: aiScore,
                architecture: Math.round(architectureScore),
                categories: categoryScores
            },
            architecture: architectureInsights
        });

    } catch (error) {
        logger.error('Analysis error:', error);

        // Update project status to failed
        try {
            const project = await Project.findById(req.params.projectId);
            if (project) {
                project.status = 'failed';
                project.error = error.message;
                await project.save();
            }
        } catch (updateError) {
            logger.error('Failed to update project status:', updateError);
        }

        next(error);
    }
};

/**
 * Detect AI in a code snippet
 */
export const detectAICode = async (req, res, next) => {
    try {
        const { code, language } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const result = await detectAI(code, language || 'javascript');

        if (!result) {
            return res.status(500).json({ error: 'Failed to analyze code' });
        }

        res.json(result);
    } catch (error) {
        logger.error('AI detection controller error:', error);
        next(error);
    }
};

/**
 * Detect AI in entire project
 */
export const detectProjectAICode = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const files = readDirectoryRecursive(project.uploadPath);
        const result = await detectProjectAI(files);

        if (!result) {
            return res.status(500).json({ error: 'Failed to analyze project' });
        }

        res.json(result);
    } catch (error) {
        logger.error('Project AI detection controller error:', error);
        next(error);
    }
};
