import express from 'express';
import { analyzeProject, detectAICode, detectProjectAICode } from '../controllers/analyze.controller.js';

const router = express.Router();

/**
 * POST /api/analyze/detect-ai
 * Detect if code is AI generated
 */
router.post('/detect-ai', detectAICode);

/**
 * POST /api/analyze/detect-project-ai/:projectId
 * Detect AI in entire project
 */
router.post('/detect-project-ai/:projectId', detectProjectAICode);

/**
 * POST /api/analyze/:projectId
 * Trigger analysis for a project
 */
router.post('/:projectId', analyzeProject);

export default router;
