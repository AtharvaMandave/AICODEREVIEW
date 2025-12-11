import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Score from '../models/Score.js';
import Analysis from '../models/Analysis.js';
import { cleanupDirectory, readDirectoryRecursive } from '../services/file-reader.service.js';
import { logger } from '../utils/logger.js';

/**
 * Get all projects (filtered by user if authenticated)
 */
export const getAllProjects = async (req, res, next) => {
    try {
        // Build query based on authentication
        const query = {};

        if (req.user) {
            // Authenticated user: show only their projects
            query.userId = req.user._id;
        } else {
            // Guest/anonymous: show only guest projects (null userId)
            query.userId = null;
        }

        const projects = await Project.find(query)
            .sort({ createdAt: -1 })
            .select('-uploadPath');

        res.json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        logger.error('Get all projects error:', error);
        next(error);
    }
};

/**
 * Get project by ID
 */
export const getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({
            success: true,
            project
        });
    } catch (error) {
        logger.error('Get project error:', error);
        next(error);
    }
};

/**
 * Delete project
 */
export const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete associated data
        await Issue.deleteMany({ projectId: project._id });
        await Score.findOneAndDelete({ projectId: project._id });
        await Analysis.findOneAndDelete({ projectId: project._id });

        // Delete uploaded files
        cleanupDirectory(project.uploadPath);

        // Delete project
        await Project.findByIdAndDelete(req.params.id);

        logger.info(`Project deleted: ${project.name} (ID: ${project._id})`);

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        logger.error('Delete project error:', error);
        next(error);
    }
};

/**
 * Get project issues
 */
export const getProjectIssues = async (req, res, next) => {
    try {
        const { severity, category, filePath } = req.query;
        const filter = { projectId: req.params.id };

        if (severity) filter.severity = severity;
        if (category) filter.category = category;
        if (filePath) filter.filePath = new RegExp(filePath, 'i');

        const issues = await Issue.find(filter).sort({ severity: 1, filePath: 1 });

        // Group by file
        const groupedByFile = {};
        for (const issue of issues) {
            if (!groupedByFile[issue.filePath]) {
                groupedByFile[issue.filePath] = [];
            }
            groupedByFile[issue.filePath].push(issue);
        }

        res.json({
            success: true,
            count: issues.length,
            issues,
            groupedByFile
        });
    } catch (error) {
        logger.error('Get project issues error:', error);
        next(error);
    }
};

/**
 * Get project scores
 */
export const getProjectScores = async (req, res, next) => {
    try {
        const score = await Score.findOne({ projectId: req.params.id });

        if (!score) {
            return res.status(404).json({ error: 'Scores not found. Please run analysis first.' });
        }

        res.json({
            success: true,
            scores: score
        });
    } catch (error) {
        logger.error('Get project scores error:', error);
        next(error);
    }
};

/**
 * Get project architecture
 */
export const getProjectArchitecture = async (req, res, next) => {
    try {
        const analysis = await Analysis.findOne({ projectId: req.params.id });

        if (!analysis || !analysis.architecture) {
            return res.status(404).json({ error: 'Architecture analysis not found. Please run analysis first.' });
        }

        res.json({
            success: true,
            architecture: analysis.architecture
        });
    } catch (error) {
        logger.error('Get project architecture error:', error);
        next(error);
    }
};

/**
 * Get project files
 */
export const getProjectFiles = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const files = await readDirectoryRecursive(project.uploadPath);

        // Transform paths to be relative to upload root
        const relativeFiles = files.map(file => ({
            ...file,
            path: file.path.replace(project.uploadPath, '').replace(/^[\\/]/, '')
        }));

        res.json({
            success: true,
            files: relativeFiles
        });
    } catch (error) {
        logger.error('Get project files error:', error);
        next(error);
    }
};
