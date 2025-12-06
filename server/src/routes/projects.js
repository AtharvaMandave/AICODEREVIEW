import express from 'express';
import { getAllProjects, getProjectById, deleteProject, getProjectIssues } from '../controllers/projectController.js';

const router = express.Router();

/**
 * GET /api/projects
 * Get all projects
 */
router.get('/', getAllProjects);

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

export default router;
