import express from 'express';
import { uploadMiddleware } from '../middlewares/multer.js';
import { uploadFile, uploadZip, uploadGithub } from '../controllers/upload.controller.js';

const router = express.Router();

/**
 * POST /api/upload/file
 * Upload a single code file
 */
router.post('/file', uploadMiddleware.single('file'), uploadFile);

/**
 * POST /api/upload/zip
 * Upload and extract a ZIP file
 */
router.post('/zip', uploadMiddleware.single('file'), uploadZip);

/**
 * POST /api/upload/github
 * Clone a GitHub repository
 */
router.post('/github', uploadGithub);

export default router;
