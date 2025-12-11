import Project from '../models/Project.js';
import { readDirectoryRecursive } from '../services/file-reader.service.js';
import { detectAI, detectProjectAI } from '../services/ai-review.service.js';
import { logger } from '../utils/logger.js';
import { performAnalysis } from '../services/analysis.service.js';

/**
 * Analyze project with Static Analysis + AI Review
 */
export const analyzeProject = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const result = await performAnalysis(projectId);
        res.json({
            success: true,
            message: 'Analysis completed successfully',
            ...result
        });
    } catch (error) {
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
