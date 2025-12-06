import express from 'express';
import { exportPDF } from '../controllers/export.controller.js';

const router = express.Router();

/**
 * GET /api/export/:projectId/pdf
 * Export project report as PDF
 */
router.get('/:projectId/pdf', exportPDF);

export default router;
