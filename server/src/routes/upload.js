import express from 'express';
import { upload } from '../utils/uploadConfig.js';
import { uploadFile, uploadZip, uploadGithub } from '../controllers/uploadController.js';

const router = express.Router();

/**
 * POST /api/upload/file
 * Upload a single code file
 */
router.post('/file', upload.single('file'), uploadFile);

/**
 * POST /api/upload/zip
 * Upload and extract a ZIP file
 */
router.post('/zip', upload.single('file'), uploadZip);

/**
 * POST /api/upload/github
 * Clone a GitHub repository
 */
router.post('/github', uploadGithub);

export default router;
