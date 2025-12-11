import express from 'express';
import {
    getAllProjects,
    getProjectById,
    deleteProject,
    getProjectIssues,
    getProjectScores,
    getProjectArchitecture,
    getProjectFiles
} from '../controllers/project.controller.js';
import { protect, optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 */
router.get('/', optionalAuth, getAllProjects);

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get('/:id', getProjectById);

/**
 * DELETE /api/projects/:id
 * Delete project
 */
router.delete('/:id', deleteProject);

/**
 * GET /api/projects/:id/issues
 * Get project issues
 */
router.get('/:id/issues', getProjectIssues);

/**
 * GET /api/projects/:id/scores
 * Get project scores
 */
router.get('/:id/scores', getProjectScores);

/**
 * GET /api/projects/:id/architecture
 * Get project architecture
 */
router.get('/:id/architecture', getProjectArchitecture);

/**
 * GET /api/projects/:id/files
 * Get project files
 */
router.get('/:id/files', getProjectFiles);

export default router;
