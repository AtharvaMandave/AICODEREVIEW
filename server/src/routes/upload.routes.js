import express from 'express';
import { uploadMiddleware } from '../middlewares/multer.js';
import { uploadFile, uploadZip, uploadGithub } from '../controllers/upload.controller.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * POST /api/upload/file
 * Upload a single code file
 */
router.post('/file', optionalAuth, uploadMiddleware.single('file'), uploadFile);

/**
 * POST /api/upload/zip
 * Upload and extract a ZIP file
 */
router.post('/zip', optionalAuth, uploadMiddleware.single('file'), uploadZip);

/**
 * POST /api/upload/github
 * Clone a GitHub repository
 */
router.post('/github', optionalAuth, uploadGithub);

export default router;

