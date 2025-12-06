import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Score from '../models/Score.js';
import Analysis from '../models/Analysis.js';
import { cleanupUpload } from '../utils/uploadConfig.js';

/**
 * GET /api/projects
 * Get all projects
 */
export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .sort({ createdAt: -1 })
            .select('-uploadPath');

        res.json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/projects/:id
 * Get project by ID
 */
export const getProjectById = async (req, res) => {
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
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/projects/:id
 * Delete project and all associated data
 */
export const deleteProject = async (req, res) => {
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
        cleanupUpload(project.uploadPath);

        // Delete project
        await Project.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/projects/:id/issues
 * Get all issues for a project
 */
export const getProjectIssues = async (req, res) => {
    try {
        const { severity, category } = req.query;
        const filter = { projectId: req.params.id };

        if (severity) filter.severity = severity;
        if (category) filter.category = category;

        const issues = await Issue.find(filter).sort({ severity: 1, lineNumber: 1 });

        res.json({
            success: true,
            count: issues.length,
            issues
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
