import express from 'express';
import { handleGithubWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

router.post('/github', handleGithubWebhook);

export default router;
